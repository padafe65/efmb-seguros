import os
import streamlit as st
import pandas as pd
import plotly.express as px
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="EFMB Seguros - Inteligencia de Negocio", page_icon="📊", layout="wide")

@st.cache_resource
def get_db_engine():
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    dbname = os.getenv("DB_NAME", "segurosmab")
    return create_engine(f"mysql+pymysql://{user}:{password}@{host}:{port}/{dbname}")

# 1. Parámetros de sesión dinámica
params = st.query_params
user_rol = str(params.get("rol", "")).strip().lower()
user_id = str(params.get("user_id", "")).strip()
user_name = str(params.get("user_name", "Usuario")).strip()
company_id = str(params.get("company_id", "")).strip()

# Validación para descartar parámetros corruptos o vacíos
if not user_id.isdigit():
    user_id = None
if not company_id.isdigit():
    company_id = None
if "encode" in user_name or "{" in user_name:
    user_name = "Usuario"

# 2. Carga relacional dinámica
def load_data(rol, u_id, comp_id):
    engine = get_db_engine()
    
    sql = """
        SELECT 
            p.id_policy,
            p.policy_number,
            p.tipo_poliza,
            p.compania_seguros,
            p.company_id,
            COALESCE(c.nombre, 'Sin Empresa Asignada') AS empresa_nombre,
            p.tipo_riesgo,
            p.tipo_vehiculo,
            p.servicio,
            p.placa,
            p.modelo,
            p.departamento_municipio,
            p.inicio_vigencia,
            p.fin_vigencia,
            p.valor_asegurado,
            p.valor_comercial,
            p.valor_total_comercial,
            p.user_id AS cliente_id,
            COALESCE(u_cliente.user_name, 'Sin Cliente') AS cliente_nombre,
            p.created_by AS creador_id,
            COALESCE(u_creador.user_name, 'No registrado') AS creador_nombre,
            COALESCE(u_creador.roles, 'N/A') AS creador_rol
        FROM policies p
        LEFT JOIN users u_cliente ON p.user_id = u_cliente.id
        LEFT JOIN users u_creador ON p.created_by = u_creador.id
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE 1=1
    """

    # --- REGLA 1: SUPERUSUARIO (Acceso total) ---
    if rol in ["super_user", "superuser"]:
        # El superusuario ve todo. Si selecciona una empresa específica, se filtra
        if comp_id:
            sql += f" AND p.company_id = {int(comp_id)}"

    # --- REGLA 2: ADMINISTRADOR O SUBADMINISTRADOR (Acceso por Compañía) ---
    elif rol in ["admin", "subadmin"]:
        if comp_id:
            # Filtro estricto por la empresa del admin o subadmin
            sql += f" AND p.company_id = {int(comp_id)}"
        elif u_id:
            # Respaldo: si no viene el ID de la empresa en la URL, se busca a qué empresa pertenece el usuario
            sql += f" AND p.company_id = (SELECT company_id FROM users WHERE id = {int(u_id)})"
        else:
            sql += " AND 1=0"

    # --- REGLA 3: USUARIO CLIENTE (Acceso a sus pólizas personales) ---
    elif rol == "user":
        if u_id:
            sql += f" AND p.user_id = {int(u_id)}"
        else:
            sql += " AND 1=0"

    df = pd.read_sql(sql, engine)

    if not df.empty:
        df['inicio_vigencia'] = pd.to_datetime(df['inicio_vigencia'])
        df['fin_vigencia'] = pd.to_datetime(df['fin_vigencia'])
        df['valor_asegurado'] = pd.to_numeric(df['valor_asegurado'], errors='coerce').fillna(0)
        df['valor_total_comercial'] = pd.to_numeric(df['valor_total_comercial'], errors='coerce').fillna(0)
    return df

df = load_data(user_rol, user_id, company_id)

# 3. Encabezado Dinámico Universal
st.title(f"👋 Bienvenido, {user_name}")

if not df.empty:
    empresa_detectada = df['empresa_nombre'].iloc[0] if user_rol != "super_user" else "Todas las Empresas (Visión Global)"
else:
    empresa_detectada = "Empresa no identificada"

st.caption(f"Perfil: **{user_rol.upper() or 'USUARIO'}** | Alcance de Datos: **{empresa_detectada.upper()}**")

if df.empty:
    st.warning("⚠️ No se encontraron pólizas registradas para esta empresa o usuario.")
    st.stop()

# 4. Filtros interactivos en la barra lateral
df_vista = df.copy()

# Si es Superusuario, puede filtrar entre todas las compañías existentes en la base de datos
if user_rol in ["super_user", "superuser"]:
    st.sidebar.header("🏢 Filtro por Empresa")
    empresas_disponibles = df['empresa_nombre'].dropna().unique().tolist()
    empresa_sel = st.sidebar.multiselect("Filtrar Empresa:", options=empresas_disponibles, default=empresas_disponibles)
    if empresa_sel:
        df_vista = df_vista[df_vista['empresa_nombre'].isin(empresa_sel)]

# Para Admin, Subadmin y Superusuario: Filtro por quién creó la póliza (Admin vs Subadmins)
creadores_en_empresa = df_vista['creador_nombre'].dropna().unique().tolist()
if len(creadores_en_empresa) > 1 and user_rol in ["admin", "subadmin", "super_user", "superuser"]:
    st.sidebar.header("👥 Filtro por Emisor")
    creador_sel = st.sidebar.multiselect("Filtrar por Creador (Admin / Subadmins):", options=creadores_en_empresa, default=creadores_en_empresa)
    if creador_sel:
        df_vista = df_vista[df_vista['creador_nombre'].isin(creador_sel)]

# 5. Indicadores Clave (KPIs)
k1, k2, k3, k4 = st.columns(4)

total_p = len(df_vista)
total_dinero = df_vista['valor_asegurado'].sum()
promedio_dinero = df_vista['valor_asegurado'].mean() if total_p > 0 else 0

hoy = pd.Timestamp.now()
activas = df_vista[(df_vista['inicio_vigencia'] <= hoy) & (df_vista['fin_vigencia'] >= hoy)].shape[0]
vencidas = df_vista[df_vista['fin_vigencia'] < hoy].shape[0]

k1.metric("Total Pólizas", f"{total_p:,}")
k2.metric("Monto Total Asegurado", f"${total_dinero:,.0f}")
k3.metric("Promedio Asegurado", f"${promedio_dinero:,.0f}")
k4.metric("Pólizas Vigentes", f"{activas}", delta=f"-{vencidas} vencidas")

st.markdown("---")

# 6. Gráficos de Inteligencia de Negocio
col_a, col_b = st.columns(2)

with col_a:
    st.subheader("👥 Pólizas por Emisor (Admin y Subadmins)")
    resumen_creador = df_vista.groupby(['creador_nombre', 'creador_rol'])['valor_asegurado'].agg(['count', 'sum']).reset_index()
    resumen_creador.columns = ['Creador', 'Rol', 'Cantidad', 'Total']
    
    fig_emisor = px.bar(
        resumen_creador,
        x='Creador',
        y='Cantidad',
        color='Rol',
        text='Cantidad',
        labels={'Creador': 'Emisor', 'Cantidad': 'Nº Pólizas'},
        title="Rendimiento del Equipo de la Compañía"
    )
    st.plotly_chart(fig_emisor, use_container_width=True)

with col_b:
    st.subheader("🥧 Distribución de Cartera por Tipo de Póliza")
    fig_cartera = px.pie(
        df_vista,
        names='tipo_poliza',
        values='valor_asegurado',
        hole=0.4,
        title="Participación de Tipos de Póliza"
    )
    st.plotly_chart(fig_cartera, use_container_width=True)

# 7. Tabla Detallada
st.subheader("📋 Inventario de Pólizas")
columnas_mostrar = [
    'policy_number', 'tipo_poliza', 'compania_seguros', 'placa',
    'inicio_vigencia', 'fin_vigencia', 'valor_asegurado',
    'cliente_nombre', 'creador_nombre', 'creador_rol', 'empresa_nombre'
]
cols_existentes = [col for col in columnas_mostrar if col in df_vista.columns]
st.dataframe(df_vista[cols_existentes], use_container_width=True)