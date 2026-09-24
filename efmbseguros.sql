--
-- PostgreSQL database dump
--

\restrict kAjmvsXYm7pGvxIBgozTnvMVEja9WUwWzfGn7Xe9SrriYRJN7zhIhFyZQhLd4Jf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-05-03 10:21:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 23192)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 867 (class 1247 OID 23224)
-- Name: cars_motor_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cars_motor_enum AS ENUM (
    'Eléctrico',
    'Híbrido',
    'Gasolina',
    'Diesel'
);


ALTER TYPE public.cars_motor_enum OWNER TO postgres;

--
-- TOC entry 864 (class 1247 OID 23214)
-- Name: cars_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cars_type_enum AS ENUM (
    'Sedán',
    'Pick-up',
    'SUV',
    'Coupe'
);


ALTER TYPE public.cars_type_enum OWNER TO postgres;

--
-- TOC entry 882 (class 1247 OID 24222)
-- Name: users_roles_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_roles_enum AS ENUM (
    'admin',
    'user',
    'super_user',
    'sub_admin'
);


ALTER TYPE public.users_roles_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 24194)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    nombre text NOT NULL,
    nit text,
    direccion text,
    telefono text,
    email text,
    logo_url text,
    color_primario text DEFAULT '#631025'::text,
    color_secundario text DEFAULT '#4c55d3'::text,
    isactive boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    whatsapp_number text,
    facebook_url text
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24193)
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 224
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- TOC entry 223 (class 1259 OID 23483)
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    asunto text NOT NULL,
    mensaje text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    leido boolean DEFAULT false NOT NULL,
    respondido boolean DEFAULT false NOT NULL,
    respuesta text,
    responded_at timestamp without time zone,
    user_id integer,
    responded_by integer,
    company_id integer
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 23482)
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_messages_id_seq OWNER TO postgres;

--
-- TOC entry 4971 (class 0 OID 0)
-- Dependencies: 222
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- TOC entry 221 (class 1259 OID 23465)
-- Name: policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policies (
    id_policy integer NOT NULL,
    policy_number text NOT NULL,
    tipo_poliza text NOT NULL,
    inicio_vigencia date NOT NULL,
    fin_vigencia date NOT NULL,
    tipo_riesgo text,
    compania_seguros text,
    telefono_asistencia text,
    valor_asegurado numeric,
    cod_fasecolda text,
    placa text,
    tonelaje_cilindraje_pasajeros text,
    departamento_municipio text,
    valor_comercial numeric,
    valor_accesorios numeric,
    valor_total_comercial numeric,
    modelo text,
    servicio text,
    tipo_vehiculo text,
    numero_motor text,
    numero_chasis text,
    beneficiario text,
    user_id integer NOT NULL,
    notificada boolean DEFAULT false NOT NULL,
    company_id integer,
    created_by_id integer,
    created_by_role text
);


ALTER TABLE public.policies OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 23464)
-- Name: policies_id_policy_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.policies_id_policy_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policies_id_policy_seq OWNER TO postgres;

--
-- TOC entry 4972 (class 0 OID 0)
-- Dependencies: 220
-- Name: policies_id_policy_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.policies_id_policy_seq OWNED BY public.policies.id_policy;


--
-- TOC entry 219 (class 1259 OID 23450)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    user_name text NOT NULL,
    documento text NOT NULL,
    isactive boolean DEFAULT true NOT NULL,
    email text NOT NULL,
    direccion text NOT NULL,
    user_password text NOT NULL,
    ciudad text NOT NULL,
    telefono text,
    actividad_empresa text,
    representante_legal text,
    fecha_nacimiento date,
    roles public.users_roles_enum[] DEFAULT '{user}'::public.users_roles_enum[] NOT NULL,
    reset_password_token text,
    reset_password_expires timestamp without time zone,
    company_id integer,
    facebook_url text,
    created_by_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 23449)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4786 (class 2604 OID 24197)
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 23486)
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- TOC entry 4780 (class 2604 OID 23468)
-- Name: policies id_policy; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies ALTER COLUMN id_policy SET DEFAULT nextval('public.policies_id_policy_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 23453)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4963 (class 0 OID 24194)
-- Dependencies: 225
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, nombre, nit, direccion, telefono, email, logo_url, color_primario, color_secundario, isactive, created_at, whatsapp_number, facebook_url) FROM stdin;
1	segurosmab	10001	Cra 72 P N° 43 A - 11 sur	3108586624	mabconsultores@gmail.com	/uploads/logos/logo-1768269350616-802023561.jpg	#631025	#4c55d3	t	2026-01-12 20:55:50.630129	\N	\N
2	segurosferrer	10002	Calle 46 sur N° 72 N  - 59 Boita	3142999274	padafe6541@gmail.com	/uploads/logos/logo-1768323177274-12154620.jpg	#631025	#4c55d3	t	2026-01-13 11:52:57.280717	\N	https://web.facebook.com/erwinaliriof
\.


--
-- TOC entry 4961 (class 0 OID 23483)
-- Dependencies: 223
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, nombre, email, asunto, mensaje, created_at, leido, respondido, respuesta, responded_at, user_id, responded_by, company_id) FROM stdin;
1	David Sebastián Ferreira	davidferrer144@gmail.com	Renovar poliza	Miguel Ángel, este es un mensaje de prueba.	2026-01-12 22:42:59.291589	f	f	\N	\N	4	\N	1
\.


--
-- TOC entry 4959 (class 0 OID 23465)
-- Dependencies: 221
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policies (id_policy, policy_number, tipo_poliza, inicio_vigencia, fin_vigencia, tipo_riesgo, compania_seguros, telefono_asistencia, valor_asegurado, cod_fasecolda, placa, tonelaje_cilindraje_pasajeros, departamento_municipio, valor_comercial, valor_accesorios, valor_total_comercial, modelo, servicio, tipo_vehiculo, numero_motor, numero_chasis, beneficiario, user_id, notificada, company_id, created_by_id, created_by_role) FROM stdin;
2	A-102	auto	2025-12-06	2026-02-03	robo y accidente	Mafre	3211234560	100000000	AFK-101	BZN - 321	5 - 1.6 - 6	Bogotá D.C	120000000	5000000	1250000	2025	Privado	automovil	Asd321321	Asd321321	Mario Arrieta y Padres	3	t	1	2	admin
6	A-105	Riesgo Robo	2024-12-23	2026-02-03	robo y accidente grado	Seguros del estado	#611	120000000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	t	1	9	sub_admin
5	A-104	Contra incendios Total 3	2024-12-25	2025-12-28	robo y accidente	Mafre 1	3211234561	100000000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	t	1	2	admin
1	A-101	Cliente Auto 3	2024-12-24	2025-12-27	Robo y accidente	Seguros del estado	3112521415	5000	C-1001	BKZ - 489	2.5 ton, 1.5 full inyección y 5 pasajeros	Bogotá D. C - Bogotá D. C	25000000	5000000	30000000	Renault - 19 - 2007	Orivado	automovil	3214568978	3214568978	Erwin Ferreira Y Vilma Mejía Sanguino	1	t	1	2	admin
8	A-108	Vida	2026-01-12	2027-01-12	Accidente y secuestro	Seguros Bolivar	#710	125000000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	f	1	2	admin
3	A-103	Vida	2026-12-03	2026-02-03	Robo e incendio	Mafre	#115	10000000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	t	1	2	admin
9	A-110	Riesgo Robo	2025-02-05	2026-02-04	robo y accidente	Seguros Bolivar	#601	25000001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	t	1	9	sub_admin
7	A-107	Vida	2026-01-11	2026-01-27	Accidente y robo	Mapfre	#611	200000000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	t	2	5	super_user
\.


--
-- TOC entry 4957 (class 0 OID 23450)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, user_name, documento, isactive, email, direccion, user_password, ciudad, telefono, actividad_empresa, representante_legal, fecha_nacimiento, roles, reset_password_token, reset_password_expires, company_id, facebook_url, created_by_id) FROM stdin;
5	Erwin Alirio Ferreira Rojas	91250451	t	padafe654@gmail.com	Calle 43 sur # 72 N - 59	$2b$10$TRxgeaJ.NLGJtWttntAXyuPYXuQ6urJ6E/cOir51tZSiNL0uO1W1m	Bogotá D. C	3026603858	Natural	Erwin Alirio Ferreira Rojas	1965-05-01	{super_user}	\N	\N	\N	\N	\N
4	David Sebastián Ferreira	1021247598	t	davidferrer144@gmail.com	CRA 72P N 43A - 11 sur	$2b$10$kv8nb5ZuE87ilvDURHGSRuWLn9xafzfkRKWBq0OmsEH1kzCycqEMq	BOGOTA D. C.	3113731558	Personal y Natural	David Ferreira	1999-09-11	{user}	\N	\N	1	\N	\N
10	Carmen García Ferreira	91256321	t	carmen2001@hotmail.com	Soacha ciudad verde	$2b$10$kp2jn2yLkvAAobVXx2rrIuvAzVOzoD8HiUd8pCxhmL0ZtrJxg82EK	Soacha	6017904289	Comercio aduanas	Vilma mejía	2001-04-29	{user}	\N	\N	1		9
7	Ruth Ferreira	913254514	t	ruthferreirarojas11@gmail.com	Soacha ciudad verde	$2b$10$Gxf18qa/xKYxnrlrtRg0eOxPRmVZngGk/hbG8vqUtMk04i886TO1K	Soacha	6017904288	Familiar	Erick Pérez	1966-01-06	{user}	\N	\N	\N	\N	2
3	Mario Arrieta	32145687	t	mar@gmail.com	Calle 9 # 3 - 21	$2b$10$2ueEXoUnaCFBnYR/TKNE/.TUnVo7iFa9YQYeC9NICM0hQosK9mmZu	Bucaramanga	3112564741	Estadistica	Mario Arrieta	1995-05-09	{user}	\N	\N	1	\N	5
2	Miguel Angel Bernal	912356245	t	mabconsultores@gmail.com	Cra 72P # 43 A - 11	$2b$10$y4mZKFBiPRv4KG1QvMVRjOwSZCiBuHrzRLUJaAAKnJ8RO45SaBX.G	Bogotá D. C	3026603858	Asesor seguros	Migel Bernal	1968-05-05	{admin}	\N	\N	1	\N	5
6	Marlon Suarez	7521410	t	marsua96@gmail.com	Calle 72 B N° 21 A - 21 sur Giron Santander	$2b$10$uUZW.gZREpJZPL/Mu6dHjuuX1Tl/Hm7zCTADvotEq/aRmlyyX2hTC	Bucaramanga	3113251458	Transporte	Isabel Ferreira	2026-01-12	{user}	\N	\N	\N	\N	2
8	Carol Jimenez	3211145287	t	carol21@hotmail.com	Calle 45 #72R- 61 Barrio Boita (Kennedy)	$2b$10$RSk1mDpO.d3X5XAuLy16x.qTfxj336ggmYDksdgjnvYX7RTiuTlvq	BOGOTA D.C.	3211245012	Comercial abarrotes	Carol Jimenez Ramirez	1975-01-03	{user}	\N	\N	1	\N	2
1	Vilma Mejía Sanguino1	63551221	t	padafe6541@gmail.com	Cra 72K # 3 - 27	$2b$10$10.KVw5zVYXpYoNrWkkJRuSsBJtdNuNcbRlC940uQz8unrGBzpkDy	Bogotá D. C	3026603858	Veterinaria 3	Vilma Mejía Sanguino	2021-04-26	{user}	\N	\N	1	\N	2
9	Gabriel Bernal Ferreira	9921451	t	gaboberfer@gmail.com	Cra 72 P N° 43 A - 11 sur	$2b$10$UQYON8.t6LPWnU.JfAGzyuJb0VSqSJXVAbCs0HhoFR3yxUkL67U4a	BOGOTA D. C.	3041010805	Seguros	Miguel Bernal	2005-04-11	{sub_admin}	\N	\N	1	https://web.facebook.com/diana.l.rojas.754	2
\.


--
-- TOC entry 4974 (class 0 OID 0)
-- Dependencies: 224
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 2, true);


--
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 222
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 1, true);


--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 220
-- Name: policies_id_policy_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.policies_id_policy_seq', 9, true);


--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- TOC entry 4798 (class 2606 OID 23472)
-- Name: policies PK_7d447bc79c022a7ec1f62a6ecff; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT "PK_7d447bc79c022a7ec1f62a6ecff" PRIMARY KEY (id_policy);


--
-- TOC entry 4792 (class 2606 OID 23459)
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 23493)
-- Name: contact_messages PK_b74f96eb2edd977ccfba6533293; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT "PK_b74f96eb2edd977ccfba6533293" PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 24205)
-- Name: companies PK_d4bc3e82a314fa9e29f652c2c22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY (id);


--
-- TOC entry 4800 (class 2606 OID 23474)
-- Name: policies UQ_0a3ff12ee86e399e522e8ec7cef; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT "UQ_0a3ff12ee86e399e522e8ec7cef" UNIQUE (policy_number);


--
-- TOC entry 4794 (class 2606 OID 23463)
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- TOC entry 4796 (class 2606 OID 23461)
-- Name: users UQ_d84b4115f335f51566778cd10bc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_d84b4115f335f51566778cd10bc" UNIQUE (documento);


--
-- TOC entry 4806 (class 2606 OID 23475)
-- Name: policies FK_0192750cdb713afc762287d6944; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT "FK_0192750cdb713afc762287d6944" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4807 (class 2606 OID 24216)
-- Name: policies FK_736c7a6c5095956a21f779f63e1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT "FK_736c7a6c5095956a21f779f63e1" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4805 (class 2606 OID 24211)
-- Name: users FK_7ae6334059289559722437bcc1c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4808 (class 2606 OID 24206)
-- Name: contact_messages FK_8b9661891fa95d3c94d46a9c55a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT "FK_8b9661891fa95d3c94d46a9c55a" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4809 (class 2606 OID 23494)
-- Name: contact_messages FK_9e5c22b90643dd077c3581f3c3b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT "FK_9e5c22b90643dd077c3581f3c3b" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4810 (class 2606 OID 23499)
-- Name: contact_messages FK_e0bab1a51bf79ba22f7ab52f480; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT "FK_e0bab1a51bf79ba22f7ab52f480" FOREIGN KEY (responded_by) REFERENCES public.users(id);


-- Completed on 2026-05-03 10:21:40

--
-- PostgreSQL database dump complete
--

\unrestrict kAjmvsXYm7pGvxIBgozTnvMVEja9WUwWzfGn7Xe9SrriYRJN7zhIhFyZQhLd4Jf

