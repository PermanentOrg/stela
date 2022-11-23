--
-- PostgreSQL database dump
--

-- Dumped from database version 14.4 (Debian 14.4-1.pgdg100+1)
-- Dumped by pg_dump version 14.4 (Debian 14.4-1.pgdg100+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access (
    accessid bigint NOT NULL,
    folder_linkid bigint NOT NULL,
    archiveid bigint NOT NULL,
    accessrole text,
    status text,
    type text,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.access OWNER TO postgres;

--
-- Name: access_accessid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.access_accessid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.access_accessid_seq OWNER TO postgres;

--
-- Name: access_accessid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.access_accessid_seq OWNED BY public.access.accessid;


--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    accountid bigint NOT NULL,
    subject text,
    primaryemail text NOT NULL,
    primaryphone text,
    fullname text,
    address text,
    address2 text,
    country text,
    city text,
    state text,
    zip text,
    defaultarchiveid bigint,
    defaultarchivecreated boolean DEFAULT true NOT NULL,
    betaparticipant integer DEFAULT 0,
    status text NOT NULL,
    emailstatus text,
    phonestatus text,
    notificationpreferences jsonb NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.account OWNER TO postgres;

--
-- Name: account_accountid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_accountid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_accountid_seq OWNER TO postgres;

--
-- Name: account_accountid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_accountid_seq OWNED BY public.account.accountid;


--
-- Name: account_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_allocation (
    account_allocationid bigint NOT NULL,
    accountid bigint NOT NULL,
    sizeinb bigint NOT NULL,
    expiresdt timestamp with time zone NOT NULL,
    toaccountid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.account_allocation OWNER TO postgres;

--
-- Name: account_allocation_account_allocationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_allocation_account_allocationid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_allocation_account_allocationid_seq OWNER TO postgres;

--
-- Name: account_allocation_account_allocationid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_allocation_account_allocationid_seq OWNED BY public.account_allocation.account_allocationid;


--
-- Name: account_archive; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_archive (
    account_archiveid bigint NOT NULL,
    accountid bigint NOT NULL,
    archiveid bigint NOT NULL,
    accessrole text,
    "position" bigint NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.account_archive OWNER TO postgres;

--
-- Name: account_archive_account_archiveid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_archive_account_archiveid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_archive_account_archiveid_seq OWNER TO postgres;

--
-- Name: account_archive_account_archiveid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_archive_account_archiveid_seq OWNED BY public.account_archive.account_archiveid;


--
-- Name: account_promo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_promo (
    account_promoid bigint NOT NULL,
    accountid bigint NOT NULL,
    promoid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.account_promo OWNER TO postgres;

--
-- Name: account_promo_account_promoid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_promo_account_promoid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_promo_account_promoid_seq OWNER TO postgres;

--
-- Name: account_promo_account_promoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_promo_account_promoid_seq OWNED BY public.account_promo.account_promoid;


--
-- Name: account_space; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_space (
    account_spaceid bigint NOT NULL,
    accountid bigint NOT NULL,
    spaceleft bigint NOT NULL,
    spacetotal bigint,
    fileleft bigint NOT NULL,
    filetotal bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.account_space OWNER TO postgres;

--
-- Name: account_space_account_spaceid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_space_account_spaceid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_space_account_spaceid_seq OWNER TO postgres;

--
-- Name: account_space_account_spaceid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_space_account_spaceid_seq OWNED BY public.account_space.account_spaceid;


--
-- Name: account_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_token (
    account_tokenid bigint NOT NULL,
    accountid bigint NOT NULL,
    stripe text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.account_token OWNER TO postgres;

--
-- Name: account_token_account_tokenid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_token_account_tokenid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_token_account_tokenid_seq OWNER TO postgres;

--
-- Name: account_token_account_tokenid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_token_account_tokenid_seq OWNED BY public.account_token.account_tokenid;


--
-- Name: activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity (
    activityid bigint NOT NULL,
    "grouping" text,
    accountid bigint,
    archivenbr text,
    fullname text,
    reftable text,
    refid bigint,
    refkey text,
    ipaddress text,
    avgrequestspermin double precision,
    classname text,
    methodname text,
    durationinsecs bigint,
    status text NOT NULL,
    type text NOT NULL,
    currentvo text,
    beforevo text,
    deltavo text,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.activity OWNER TO postgres;

--
-- Name: activity_activityid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_activityid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_activityid_seq OWNER TO postgres;

--
-- Name: activity_activityid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_activityid_seq OWNED BY public.activity.activityid;


--
-- Name: archive; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archive (
    archiveid bigint NOT NULL,
    publicdt timestamp with time zone,
    archivenbr text,
    public integer DEFAULT 0,
    allowpublicdownload boolean DEFAULT true NOT NULL,
    view text,
    viewproperty text,
    vaultkey text,
    thumbarchivenbr text,
    imageratio numeric(6,2),
    thumbstatus text,
    thumburl200 text,
    thumburl500 text,
    thumburl1000 text,
    thumburl2000 text,
    thumbdt timestamp with time zone,
    status text,
    type text,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.archive OWNER TO postgres;

--
-- Name: archive_archiveid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archive_archiveid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.archive_archiveid_seq OWNER TO postgres;

--
-- Name: archive_archiveid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archive_archiveid_seq OWNED BY public.archive.archiveid;


--
-- Name: archive_nbr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archive_nbr (
    archivenbrid bigint NOT NULL,
    archivenbr text NOT NULL,
    reftable text NOT NULL,
    refid bigint NOT NULL,
    archivepart text NOT NULL,
    itempart text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.archive_nbr OWNER TO postgres;

--
-- Name: archive_nbr_archivenbrid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archive_nbr_archivenbrid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.archive_nbr_archivenbrid_seq OWNER TO postgres;

--
-- Name: archive_nbr_archivenbrid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archive_nbr_archivenbrid_seq OWNED BY public.archive_nbr.archivenbrid;


--
-- Name: auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth (
    authid bigint NOT NULL,
    accountid bigint NOT NULL,
    archiveid bigint NOT NULL,
    token text NOT NULL,
    expiresdt timestamp with time zone,
    ipaddress text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.auth OWNER TO postgres;

--
-- Name: auth_authid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_authid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auth_authid_seq OWNER TO postgres;

--
-- Name: auth_authid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_authid_seq OWNED BY public.auth.authid;


--
-- Name: connector_facebook; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connector_facebook (
    connector_facebookid bigint NOT NULL,
    archiveid bigint NOT NULL,
    reftable text NOT NULL,
    refid bigint NOT NULL,
    displayname text NOT NULL,
    path text,
    fbkey text,
    fbcreateddt timestamp with time zone,
    fbupdateddt timestamp with time zone,
    fbtype text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.connector_facebook OWNER TO postgres;

--
-- Name: connector_facebook_connector_facebookid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.connector_facebook_connector_facebookid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.connector_facebook_connector_facebookid_seq OWNER TO postgres;

--
-- Name: connector_facebook_connector_facebookid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.connector_facebook_connector_facebookid_seq OWNED BY public.connector_facebook.connector_facebookid;


--
-- Name: connector_familysearch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connector_familysearch (
    connector_familysearchid bigint NOT NULL,
    personid text DEFAULT ''::text NOT NULL,
    memoryid bigint,
    recordid bigint,
    byaccountid bigint NOT NULL,
    toarchiveid bigint NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.connector_familysearch OWNER TO postgres;

--
-- Name: connector_familysearch_connector_familysearchid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.connector_familysearch_connector_familysearchid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.connector_familysearch_connector_familysearchid_seq OWNER TO postgres;

--
-- Name: connector_familysearch_connector_familysearchid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.connector_familysearch_connector_familysearchid_seq OWNED BY public.connector_familysearch.connector_familysearchid;


--
-- Name: connector_overview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connector_overview (
    connector_overviewid bigint NOT NULL,
    archiveid bigint NOT NULL,
    lastexecutedt timestamp with time zone,
    token text,
    userid text,
    currentstate text NOT NULL,
    checkpointdt timestamp with time zone,
    errorcount bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.connector_overview OWNER TO postgres;

--
-- Name: connector_overview_connector_overviewid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.connector_overview_connector_overviewid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.connector_overview_connector_overviewid_seq OWNER TO postgres;

--
-- Name: connector_overview_connector_overviewid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.connector_overview_connector_overviewid_seq OWNED BY public.connector_overview.connector_overviewid;


--
-- Name: contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact (
    contactid bigint NOT NULL,
    archiveid bigint,
    bycontactid bigint,
    fullname text NOT NULL,
    email text NOT NULL,
    title text,
    message text,
    notes text,
    timessent bigint,
    lastsentdt timestamp with time zone,
    boardtype text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.contact OWNER TO postgres;

--
-- Name: contact_contactid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_contactid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contact_contactid_seq OWNER TO postgres;

--
-- Name: contact_contactid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_contactid_seq OWNED BY public.contact.contactid;


--
-- Name: daemon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daemon (
    daemonid bigint NOT NULL,
    archiveid bigint,
    accountid bigint,
    lastexecutedt timestamp with time zone NOT NULL,
    nextexecutedt timestamp with time zone NOT NULL,
    note text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.daemon OWNER TO postgres;

--
-- Name: daemon_daemonid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daemon_daemonid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.daemon_daemonid_seq OWNER TO postgres;

--
-- Name: daemon_daemonid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daemon_daemonid_seq OWNED BY public.daemon.daemonid;


--
-- Name: device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device (
    deviceid bigint NOT NULL,
    accountid bigint,
    nickname text,
    uuid text,
    timesused bigint,
    lastuseddt timestamp with time zone,
    model text,
    os text,
    location text,
    appversion text,
    apiversion text,
    screenheight bigint,
    screenwidth bigint,
    token text NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.device OWNER TO postgres;

--
-- Name: device_deviceid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_deviceid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.device_deviceid_seq OWNER TO postgres;

--
-- Name: device_deviceid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_deviceid_seq OWNED BY public.device.deviceid;


--
-- Name: email; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email (
    emailid bigint NOT NULL,
    email text NOT NULL,
    accountid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.email OWNER TO postgres;

--
-- Name: email_emailid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_emailid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_emailid_seq OWNER TO postgres;

--
-- Name: email_emailid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_emailid_seq OWNED BY public.email.emailid;


--
-- Name: file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.file (
    fileid bigint NOT NULL,
    size bigint,
    format text,
    parentfileid bigint,
    contenttype text,
    contentversion text,
    s3version text,
    s3versionid text,
    md5checksum text,
    cloud1 text,
    cloud2 text,
    cloud3 text,
    archiveid bigint NOT NULL,
    height bigint,
    width bigint,
    durationinsecs bigint,
    fileurl text,
    downloadurl text,
    urldt timestamp with time zone,
    status text NOT NULL,
    type text,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.file OWNER TO postgres;

--
-- Name: file_fileid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.file_fileid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.file_fileid_seq OWNER TO postgres;

--
-- Name: file_fileid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.file_fileid_seq OWNED BY public.file.fileid;


--
-- Name: folder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folder (
    folderid bigint NOT NULL,
    archivenbr text,
    archiveid bigint,
    displayname text NOT NULL,
    downloadname text,
    downloadnameok boolean DEFAULT false NOT NULL,
    displaydt timestamp with time zone,
    displayenddt timestamp with time zone,
    deriveddt timestamp with time zone,
    derivedenddt timestamp with time zone,
    timezoneid bigint,
    note text,
    description text,
    special text,
    sort text,
    locnid bigint,
    view text,
    viewproperty text,
    thumbarchivenbr text,
    imageratio numeric(6,2),
    thumbstatus text,
    thumburl200 text,
    thumburl500 text,
    thumburl1000 text,
    thumburl2000 text,
    thumbdt timestamp with time zone,
    status text,
    type text,
    publicdt timestamp with time zone,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.folder OWNER TO postgres;

--
-- Name: folder_folderid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.folder_folderid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.folder_folderid_seq OWNER TO postgres;

--
-- Name: folder_folderid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.folder_folderid_seq OWNED BY public.folder.folderid;


--
-- Name: folder_link; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folder_link (
    folder_linkid bigint NOT NULL,
    folderid bigint,
    recordid bigint,
    parentfolder_linkid bigint,
    parentfolderid bigint,
    archiveid bigint NOT NULL,
    "position" bigint NOT NULL,
    linkcount bigint,
    accessrole text NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    sharedt timestamp with time zone,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.folder_link OWNER TO postgres;

--
-- Name: folder_link_folder_linkid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.folder_link_folder_linkid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.folder_link_folder_linkid_seq OWNER TO postgres;

--
-- Name: folder_link_folder_linkid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.folder_link_folder_linkid_seq OWNED BY public.folder_link.folder_linkid;


--
-- Name: folder_size; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folder_size (
    folder_sizeid bigint NOT NULL,
    folder_linkid bigint NOT NULL,
    archiveid bigint NOT NULL,
    folderid bigint NOT NULL,
    parentfolder_linkid bigint,
    parentfolderid bigint,
    myfilesizeshallow bigint NOT NULL,
    myfilesizedeep bigint NOT NULL,
    myfoldercountshallow bigint NOT NULL,
    myfoldercountdeep bigint NOT NULL,
    myrecordcountshallow bigint NOT NULL,
    myrecordcountdeep bigint NOT NULL,
    myaudiocountshallow bigint NOT NULL,
    myaudiocountdeep bigint NOT NULL,
    mydocumentcountshallow bigint NOT NULL,
    mydocumentcountdeep bigint NOT NULL,
    myexperiencecountshallow bigint NOT NULL,
    myexperiencecountdeep bigint NOT NULL,
    myimagecountshallow bigint NOT NULL,
    myimagecountdeep bigint NOT NULL,
    myvideocountshallow bigint NOT NULL,
    myvideocountdeep bigint NOT NULL,
    allfilesizeshallow bigint NOT NULL,
    allfilesizedeep bigint NOT NULL,
    allfoldercountshallow bigint NOT NULL,
    allfoldercountdeep bigint NOT NULL,
    allrecordcountshallow bigint NOT NULL,
    allrecordcountdeep bigint NOT NULL,
    allaudiocountshallow bigint NOT NULL,
    allaudiocountdeep bigint NOT NULL,
    alldocumentcountshallow bigint NOT NULL,
    alldocumentcountdeep bigint NOT NULL,
    allexperiencecountshallow bigint NOT NULL,
    allexperiencecountdeep bigint NOT NULL,
    allimagecountshallow bigint NOT NULL,
    allimagecountdeep bigint NOT NULL,
    allvideocountshallow bigint NOT NULL,
    allvideocountdeep bigint NOT NULL,
    lastexecutedt timestamp with time zone NOT NULL,
    lastexecutereason text NOT NULL,
    nextexecutedt timestamp with time zone NOT NULL,
    displayname text,
    description text,
    "position" bigint,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone,
    folder_sizecol text
);


ALTER TABLE public.folder_size OWNER TO postgres;

--
-- Name: folder_size_folder_sizeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.folder_size_folder_sizeid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.folder_size_folder_sizeid_seq OWNER TO postgres;

--
-- Name: folder_size_folder_sizeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.folder_size_folder_sizeid_seq OWNED BY public.folder_size.folder_sizeid;


--
-- Name: idp_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idp_keys (
    idp_domain text NOT NULL,
    jwks text NOT NULL,
    createddt timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updateddt timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.idp_keys OWNER TO postgres;

--
-- Name: invite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite (
    inviteid bigint NOT NULL,
    email text NOT NULL,
    byarchiveid bigint,
    byaccountid bigint,
    expiresdt timestamp with time zone,
    fullname text,
    message text,
    relationship text,
    accessrole text,
    timessent bigint,
    giftsizeinmb bigint,
    token text NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.invite OWNER TO postgres;

--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite_codes (
    invitecodeid bigint NOT NULL,
    codename text NOT NULL,
    sizeinbytes bigint NOT NULL,
    monetaryvalue numeric(10,2) NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.invite_codes OWNER TO postgres;

--
-- Name: invite_codes_invitecodeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invite_codes_invitecodeid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invite_codes_invitecodeid_seq OWNER TO postgres;

--
-- Name: invite_codes_invitecodeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invite_codes_invitecodeid_seq OWNED BY public.invite_codes.invitecodeid;


--
-- Name: invite_inviteid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invite_inviteid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invite_inviteid_seq OWNER TO postgres;

--
-- Name: invite_inviteid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invite_inviteid_seq OWNED BY public.invite.inviteid;


--
-- Name: invite_share; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite_share (
    invite_shareid bigint NOT NULL,
    inviteid bigint NOT NULL,
    folder_linkid bigint,
    accessrole text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.invite_share OWNER TO postgres;

--
-- Name: invite_share_invite_shareid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invite_share_invite_shareid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invite_share_invite_shareid_seq OWNER TO postgres;

--
-- Name: invite_share_invite_shareid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invite_share_invite_shareid_seq OWNED BY public.invite_share.invite_shareid;


--
-- Name: ledger_financial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_financial (
    ledger_financialid bigint NOT NULL,
    type text NOT NULL,
    spacedelta bigint NOT NULL,
    filedelta bigint NOT NULL,
    fromaccountid bigint NOT NULL,
    fromspacebefore bigint NOT NULL,
    fromspaceleft bigint NOT NULL,
    fromspacetotal bigint NOT NULL,
    fromfilebefore bigint NOT NULL,
    fromfileleft bigint NOT NULL,
    fromfiletotal bigint NOT NULL,
    toaccountid bigint NOT NULL,
    tospacebefore bigint NOT NULL,
    tospaceleft bigint NOT NULL,
    tospacetotal bigint NOT NULL,
    tofilebefore bigint NOT NULL,
    tofileleft bigint NOT NULL,
    tofiletotal bigint NOT NULL,
    monetaryamount numeric(13,2),
    storageamount numeric(13,2),
    donationamount numeric(13,2),
    donationmatchamount numeric(13,2),
    transactionnbr text,
    status text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.ledger_financial OWNER TO postgres;

--
-- Name: ledger_financial_ledger_financialid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ledger_financial_ledger_financialid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ledger_financial_ledger_financialid_seq OWNER TO postgres;

--
-- Name: ledger_financial_ledger_financialid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ledger_financial_ledger_financialid_seq OWNED BY public.ledger_financial.ledger_financialid;


--
-- Name: ledger_nonfinancial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_nonfinancial (
    ledger_nonfinancialid bigint NOT NULL,
    type text NOT NULL,
    spacedelta bigint NOT NULL,
    filedelta bigint NOT NULL,
    fromaccountid bigint NOT NULL,
    fromspacebefore bigint NOT NULL,
    fromspaceleft bigint NOT NULL,
    fromspacetotal bigint NOT NULL,
    fromfilebefore bigint NOT NULL,
    fromfileleft bigint NOT NULL,
    fromfiletotal bigint NOT NULL,
    toaccountid bigint NOT NULL,
    tospacebefore bigint NOT NULL,
    tospaceleft bigint NOT NULL,
    tospacetotal bigint NOT NULL,
    tofilebefore bigint NOT NULL,
    tofileleft bigint NOT NULL,
    tofiletotal bigint NOT NULL,
    transactionnbr text,
    recordid bigint,
    fileid bigint,
    status text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.ledger_nonfinancial OWNER TO postgres;

--
-- Name: ledger_nonfinancial_ledger_nonfinancialid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ledger_nonfinancial_ledger_nonfinancialid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ledger_nonfinancial_ledger_nonfinancialid_seq OWNER TO postgres;

--
-- Name: ledger_nonfinancial_ledger_nonfinancialid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ledger_nonfinancial_ledger_nonfinancialid_seq OWNED BY public.ledger_nonfinancial.ledger_nonfinancialid;


--
-- Name: locn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locn (
    locnid bigint NOT NULL,
    displayname text,
    geocodelookup text,
    streetnumber text,
    streetname text,
    postalcode text,
    locality text,
    adminonename text,
    adminonecode text,
    admintwoname text,
    admintwocode text,
    country text,
    countrycode text,
    geometrytype text,
    latitude double precision,
    longitude double precision,
    boundsouth double precision,
    boundwest double precision,
    boundnorth double precision,
    boundeast double precision,
    geometryasarray text,
    geocodetype text,
    geocoderesponseasxml text,
    timezoneid bigint,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.locn OWNER TO postgres;

--
-- Name: locn_locnid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locn_locnid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locn_locnid_seq OWNER TO postgres;

--
-- Name: locn_locnid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locn_locnid_seq OWNED BY public.locn.locnid;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    notificationid bigint NOT NULL,
    toaccountid bigint,
    toarchiveid bigint,
    fromaccountid bigint,
    fromarchiveid bigint,
    folder_linkid bigint,
    message text NOT NULL,
    redirecturl text,
    thumbarchivenbr text,
    timessent bigint,
    lastsentdt timestamp with time zone,
    emailkvp text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_notificationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_notificationid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_notificationid_seq OWNER TO postgres;

--
-- Name: notification_notificationid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_notificationid_seq OWNED BY public.notification.notificationid;


--
-- Name: preference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preference (
    preferenceid bigint NOT NULL,
    accountid bigint NOT NULL,
    archiveid bigint NOT NULL,
    "grouping" text,
    fieldnameui text NOT NULL,
    description text NOT NULL,
    value text NOT NULL,
    valuetype text NOT NULL,
    validation text,
    "position" bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.preference OWNER TO postgres;

--
-- Name: preference_preferenceid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preference_preferenceid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.preference_preferenceid_seq OWNER TO postgres;

--
-- Name: preference_preferenceid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preference_preferenceid_seq OWNED BY public.preference.preferenceid;


--
-- Name: profile_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile_item (
    profile_itemid bigint NOT NULL,
    archiveid bigint NOT NULL,
    fieldnameui text NOT NULL,
    string1 text,
    string2 text,
    string3 text,
    int1 bigint,
    int2 bigint,
    int3 bigint,
    datetime1 timestamp with time zone,
    datetime2 timestamp with time zone,
    day1 date,
    day2 date,
    locnid1 bigint,
    locnid2 bigint,
    text_dataid1 bigint,
    text_dataid2 bigint,
    otherid1 bigint,
    otherid2 bigint,
    archivearchivenbr text,
    recordarchivenbr text,
    folderarchivenbr text,
    isvisible smallint,
    publicdt timestamp with time zone,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.profile_item OWNER TO postgres;

--
-- Name: profile_item_profile_itemid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profile_item_profile_itemid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profile_item_profile_itemid_seq OWNER TO postgres;

--
-- Name: profile_item_profile_itemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profile_item_profile_itemid_seq OWNED BY public.profile_item.profile_itemid;


--
-- Name: promo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo (
    promoid bigint NOT NULL,
    code text NOT NULL,
    sizeinmb bigint NOT NULL,
    expiresdt timestamp with time zone NOT NULL,
    remaininguses bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.promo OWNER TO postgres;

--
-- Name: promo_promoid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_promoid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.promo_promoid_seq OWNER TO postgres;

--
-- Name: promo_promoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_promoid_seq OWNED BY public.promo.promoid;


--
-- Name: publish_ia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publish_ia (
    publish_iaid bigint NOT NULL,
    archiveid bigint NOT NULL,
    accountid bigint NOT NULL,
    folder_linkid bigint NOT NULL,
    permalink text,
    identifier text DEFAULT ''::text NOT NULL,
    status text,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.publish_ia OWNER TO postgres;

--
-- Name: publish_ia_publish_iaid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.publish_ia_publish_iaid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.publish_ia_publish_iaid_seq OWNER TO postgres;

--
-- Name: publish_ia_publish_iaid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.publish_ia_publish_iaid_seq OWNED BY public.publish_ia.publish_iaid;


--
-- Name: publishurl; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publishurl (
    urlid bigint NOT NULL,
    urltoken text NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    folder_linkid bigint NOT NULL,
    editable bigint,
    expiresdt timestamp with time zone,
    createddt timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updateddt timestamp with time zone,
    url text NOT NULL,
    deleted integer
);


ALTER TABLE public.publishurl OWNER TO postgres;

--
-- Name: publishurl_urlid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.publishurl_urlid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.publishurl_urlid_seq OWNER TO postgres;

--
-- Name: publishurl_urlid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.publishurl_urlid_seq OWNED BY public.publishurl.urlid;


--
-- Name: record; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.record (
    recordid bigint NOT NULL,
    archiveid bigint NOT NULL,
    archivenbr text,
    publicdt timestamp with time zone,
    displayname text NOT NULL,
    note text,
    description text,
    uploadfilename text NOT NULL,
    downloadname text,
    downloadnameok boolean DEFAULT false NOT NULL,
    uploadaccountid bigint NOT NULL,
    size bigint,
    displaydt timestamp with time zone,
    deriveddt timestamp with time zone,
    displayenddt timestamp with time zone,
    derivedenddt timestamp with time zone,
    derivedcreateddt timestamp with time zone,
    timezoneid bigint,
    locnid bigint,
    view text,
    viewproperty text,
    imageratio numeric(6,2),
    encryption text,
    metatoken text,
    refarchivenbr text,
    thumbstatus text,
    thumburl200 text,
    thumburl500 text,
    thumburl1000 text,
    thumburl2000 text,
    thumbdt timestamp with time zone,
    filestatus text,
    status text NOT NULL,
    type text NOT NULL,
    processeddt timestamp with time zone,
    createddt timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updateddt timestamp with time zone
);


ALTER TABLE public.record OWNER TO postgres;

--
-- Name: record_exif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.record_exif (
    record_exifid bigint NOT NULL,
    recordid bigint NOT NULL,
    height bigint,
    width bigint,
    shutterspeed double precision,
    focallength double precision,
    aperture double precision,
    fnumber text,
    exposure double precision,
    iso bigint,
    brightness double precision,
    flash text,
    whitebalance bigint,
    xdpi bigint,
    ydpi bigint,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.record_exif OWNER TO postgres;

--
-- Name: record_exif_record_exifid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.record_exif_record_exifid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.record_exif_record_exifid_seq OWNER TO postgres;

--
-- Name: record_exif_record_exifid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.record_exif_record_exifid_seq OWNED BY public.record_exif.record_exifid;


--
-- Name: record_file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.record_file (
    record_fileid bigint NOT NULL,
    recordid bigint NOT NULL,
    fileid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.record_file OWNER TO postgres;

--
-- Name: record_file_record_fileid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.record_file_record_fileid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.record_file_record_fileid_seq OWNER TO postgres;

--
-- Name: record_file_record_fileid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.record_file_record_fileid_seq OWNED BY public.record_file.record_fileid;


--
-- Name: record_recordid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.record_recordid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.record_recordid_seq OWNER TO postgres;

--
-- Name: record_recordid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.record_recordid_seq OWNED BY public.record.recordid;


--
-- Name: relation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relation (
    relationid bigint NOT NULL,
    archiveid bigint NOT NULL,
    relationarchiveid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    publicdt timestamp with time zone,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.relation OWNER TO postgres;

--
-- Name: relation_relationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relation_relationid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.relation_relationid_seq OWNER TO postgres;

--
-- Name: relation_relationid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.relation_relationid_seq OWNED BY public.relation.relationid;


--
-- Name: share; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.share (
    shareid bigint NOT NULL,
    folder_linkid bigint NOT NULL,
    archiveid bigint NOT NULL,
    accessrole text,
    status text,
    type text,
    requesttoken text,
    previewtoggle integer DEFAULT 0,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.share OWNER TO postgres;

--
-- Name: share_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.share_activity (
    share_activityid bigint NOT NULL,
    share_activitytype text,
    affectedarchiveid bigint,
    activityvalues jsonb,
    ownerarchiveid bigint,
    owneraccountid bigint,
    emailstatus text,
    byaccountid bigint,
    byarchiveid bigint,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.share_activity OWNER TO postgres;

--
-- Name: share_activity_share_activityid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.share_activity_share_activityid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.share_activity_share_activityid_seq OWNER TO postgres;

--
-- Name: share_activity_share_activityid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.share_activity_share_activityid_seq OWNED BY public.share_activity.share_activityid;


--
-- Name: share_shareid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.share_shareid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.share_shareid_seq OWNER TO postgres;

--
-- Name: share_shareid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.share_shareid_seq OWNED BY public.share.shareid;


--
-- Name: shareby_url; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shareby_url (
    shareby_urlid bigint NOT NULL,
    folder_linkid bigint NOT NULL,
    status text,
    urltoken text NOT NULL,
    shareurl text NOT NULL,
    uses bigint,
    maxuses bigint,
    autoapprovetoggle integer DEFAULT 0,
    previewtoggle smallint,
    defaultaccessrole text,
    expiresdt timestamp with time zone,
    byaccountid bigint NOT NULL,
    byarchiveid bigint NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.shareby_url OWNER TO postgres;

--
-- Name: shareby_url_shareby_urlid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shareby_url_shareby_urlid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shareby_url_shareby_urlid_seq OWNER TO postgres;

--
-- Name: shareby_url_shareby_urlid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shareby_url_shareby_urlid_seq OWNED BY public.shareby_url.shareby_urlid;


--
-- Name: sqs_task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sqs_task (
    sqstaskid bigint NOT NULL,
    void text NOT NULL,
    taskconstant text NOT NULL,
    updateddt timestamp with time zone,
    createddt timestamp with time zone
);


ALTER TABLE public.sqs_task OWNER TO postgres;

--
-- Name: sqs_task_sqstaskid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sqs_task_sqstaskid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sqs_task_sqstaskid_seq OWNER TO postgres;

--
-- Name: sqs_task_sqstaskid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sqs_task_sqstaskid_seq OWNED BY public.sqs_task.sqstaskid;


--
-- Name: summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.summary (
    summaryid bigint NOT NULL,
    accountid bigint NOT NULL,
    archiveid bigint NOT NULL,
    value text NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.summary OWNER TO postgres;

--
-- Name: summary_summaryid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.summary_summaryid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.summary_summaryid_seq OWNER TO postgres;

--
-- Name: summary_summaryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.summary_summaryid_seq OWNED BY public.summary.summaryid;


--
-- Name: system_report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_report (
    system_reportid bigint NOT NULL,
    reportdt timestamp with time zone,
    action text,
    expected text,
    actual text,
    detail text,
    status text NOT NULL,
    type text,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.system_report OWNER TO postgres;

--
-- Name: system_report_system_reportid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_report_system_reportid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_report_system_reportid_seq OWNER TO postgres;

--
-- Name: system_report_system_reportid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_report_system_reportid_seq OWNED BY public.system_report.system_reportid;


--
-- Name: tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag (
    tagid bigint NOT NULL,
    name text NOT NULL,
    archiveid bigint,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.tag OWNER TO postgres;

--
-- Name: tag_link; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag_link (
    tag_linkid bigint NOT NULL,
    tagid bigint NOT NULL,
    refid bigint NOT NULL,
    reftable text NOT NULL,
    offset_x double precision,
    offset_y double precision,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.tag_link OWNER TO postgres;

--
-- Name: tag_link_tag_linkid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_link_tag_linkid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_link_tag_linkid_seq OWNER TO postgres;

--
-- Name: tag_link_tag_linkid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tag_link_tag_linkid_seq OWNED BY public.tag_link.tag_linkid;


--
-- Name: tag_tagid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_tagid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_tagid_seq OWNER TO postgres;

--
-- Name: tag_tagid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tag_tagid_seq OWNED BY public.tag.tagid;


--
-- Name: task_singleton; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_singleton (
    tasksingletonid bigint NOT NULL,
    reftable text NOT NULL,
    refid bigint NOT NULL,
    lastexecutedt timestamp with time zone NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.task_singleton OWNER TO postgres;

--
-- Name: task_singleton_tasksingletonid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_singleton_tasksingletonid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_singleton_tasksingletonid_seq OWNER TO postgres;

--
-- Name: task_singleton_tasksingletonid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_singleton_tasksingletonid_seq OWNED BY public.task_singleton.tasksingletonid;


--
-- Name: taskthrottle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taskthrottle (
    taskthrottleid bigint NOT NULL,
    reftable text NOT NULL,
    refid bigint NOT NULL,
    lastexecutedt timestamp with time zone NOT NULL,
    limitinsec bigint NOT NULL,
    nextexecutedt timestamp with time zone NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.taskthrottle OWNER TO postgres;

--
-- Name: taskthrottle_taskthrottleid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.taskthrottle_taskthrottleid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.taskthrottle_taskthrottleid_seq OWNER TO postgres;

--
-- Name: taskthrottle_taskthrottleid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.taskthrottle_taskthrottleid_seq OWNED BY public.taskthrottle.taskthrottleid;


--
-- Name: text_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.text_data (
    text_dataid bigint NOT NULL,
    reftable text NOT NULL,
    refid bigint NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    valuetext text,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.text_data OWNER TO postgres;

--
-- Name: text_data_text_dataid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.text_data_text_dataid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.text_data_text_dataid_seq OWNER TO postgres;

--
-- Name: text_data_text_dataid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.text_data_text_dataid_seq OWNED BY public.text_data.text_dataid;


--
-- Name: timezone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timezone (
    timezoneid bigint NOT NULL,
    displayname text,
    timezoneplace text,
    stdname text,
    stdabbrev text,
    stdoffset text,
    dstname text,
    dstabbrev text,
    dstoffset text,
    countrycode text,
    country text,
    status text,
    type text,
    createddt timestamp with time zone,
    updateddt timestamp with time zone
);


ALTER TABLE public.timezone OWNER TO postgres;

--
-- Name: zip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zip (
    zipid bigint NOT NULL,
    name text,
    items text,
    archiveid bigint,
    url text,
    status text NOT NULL,
    type text NOT NULL,
    createddt timestamp with time zone NOT NULL,
    updateddt timestamp with time zone NOT NULL
);


ALTER TABLE public.zip OWNER TO postgres;

--
-- Name: zip_zipid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zip_zipid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.zip_zipid_seq OWNER TO postgres;

--
-- Name: zip_zipid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.zip_zipid_seq OWNED BY public.zip.zipid;


--
-- Name: access accessid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access ALTER COLUMN accessid SET DEFAULT nextval('public.access_accessid_seq'::regclass);


--
-- Name: account accountid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account ALTER COLUMN accountid SET DEFAULT nextval('public.account_accountid_seq'::regclass);


--
-- Name: account_allocation account_allocationid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_allocation ALTER COLUMN account_allocationid SET DEFAULT nextval('public.account_allocation_account_allocationid_seq'::regclass);


--
-- Name: account_archive account_archiveid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_archive ALTER COLUMN account_archiveid SET DEFAULT nextval('public.account_archive_account_archiveid_seq'::regclass);


--
-- Name: account_promo account_promoid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_promo ALTER COLUMN account_promoid SET DEFAULT nextval('public.account_promo_account_promoid_seq'::regclass);


--
-- Name: account_space account_spaceid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_space ALTER COLUMN account_spaceid SET DEFAULT nextval('public.account_space_account_spaceid_seq'::regclass);


--
-- Name: account_token account_tokenid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_token ALTER COLUMN account_tokenid SET DEFAULT nextval('public.account_token_account_tokenid_seq'::regclass);


--
-- Name: activity activityid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity ALTER COLUMN activityid SET DEFAULT nextval('public.activity_activityid_seq'::regclass);


--
-- Name: archive archiveid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archive ALTER COLUMN archiveid SET DEFAULT nextval('public.archive_archiveid_seq'::regclass);


--
-- Name: archive_nbr archivenbrid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archive_nbr ALTER COLUMN archivenbrid SET DEFAULT nextval('public.archive_nbr_archivenbrid_seq'::regclass);


--
-- Name: auth authid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth ALTER COLUMN authid SET DEFAULT nextval('public.auth_authid_seq'::regclass);


--
-- Name: connector_facebook connector_facebookid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_facebook ALTER COLUMN connector_facebookid SET DEFAULT nextval('public.connector_facebook_connector_facebookid_seq'::regclass);


--
-- Name: connector_familysearch connector_familysearchid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_familysearch ALTER COLUMN connector_familysearchid SET DEFAULT nextval('public.connector_familysearch_connector_familysearchid_seq'::regclass);


--
-- Name: connector_overview connector_overviewid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_overview ALTER COLUMN connector_overviewid SET DEFAULT nextval('public.connector_overview_connector_overviewid_seq'::regclass);


--
-- Name: contact contactid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact ALTER COLUMN contactid SET DEFAULT nextval('public.contact_contactid_seq'::regclass);


--
-- Name: daemon daemonid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daemon ALTER COLUMN daemonid SET DEFAULT nextval('public.daemon_daemonid_seq'::regclass);


--
-- Name: device deviceid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device ALTER COLUMN deviceid SET DEFAULT nextval('public.device_deviceid_seq'::regclass);


--
-- Name: email emailid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email ALTER COLUMN emailid SET DEFAULT nextval('public.email_emailid_seq'::regclass);


--
-- Name: file fileid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file ALTER COLUMN fileid SET DEFAULT nextval('public.file_fileid_seq'::regclass);


--
-- Name: folder folderid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder ALTER COLUMN folderid SET DEFAULT nextval('public.folder_folderid_seq'::regclass);


--
-- Name: folder_link folder_linkid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_link ALTER COLUMN folder_linkid SET DEFAULT nextval('public.folder_link_folder_linkid_seq'::regclass);


--
-- Name: folder_size folder_sizeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_size ALTER COLUMN folder_sizeid SET DEFAULT nextval('public.folder_size_folder_sizeid_seq'::regclass);


--
-- Name: invite inviteid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite ALTER COLUMN inviteid SET DEFAULT nextval('public.invite_inviteid_seq'::regclass);


--
-- Name: invite_codes invitecodeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_codes ALTER COLUMN invitecodeid SET DEFAULT nextval('public.invite_codes_invitecodeid_seq'::regclass);


--
-- Name: invite_share invite_shareid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_share ALTER COLUMN invite_shareid SET DEFAULT nextval('public.invite_share_invite_shareid_seq'::regclass);


--
-- Name: ledger_financial ledger_financialid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_financial ALTER COLUMN ledger_financialid SET DEFAULT nextval('public.ledger_financial_ledger_financialid_seq'::regclass);


--
-- Name: ledger_nonfinancial ledger_nonfinancialid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_nonfinancial ALTER COLUMN ledger_nonfinancialid SET DEFAULT nextval('public.ledger_nonfinancial_ledger_nonfinancialid_seq'::regclass);


--
-- Name: locn locnid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locn ALTER COLUMN locnid SET DEFAULT nextval('public.locn_locnid_seq'::regclass);


--
-- Name: notification notificationid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN notificationid SET DEFAULT nextval('public.notification_notificationid_seq'::regclass);


--
-- Name: preference preferenceid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference ALTER COLUMN preferenceid SET DEFAULT nextval('public.preference_preferenceid_seq'::regclass);


--
-- Name: profile_item profile_itemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_item ALTER COLUMN profile_itemid SET DEFAULT nextval('public.profile_item_profile_itemid_seq'::regclass);


--
-- Name: promo promoid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo ALTER COLUMN promoid SET DEFAULT nextval('public.promo_promoid_seq'::regclass);


--
-- Name: publish_ia publish_iaid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publish_ia ALTER COLUMN publish_iaid SET DEFAULT nextval('public.publish_ia_publish_iaid_seq'::regclass);


--
-- Name: publishurl urlid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publishurl ALTER COLUMN urlid SET DEFAULT nextval('public.publishurl_urlid_seq'::regclass);


--
-- Name: record recordid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record ALTER COLUMN recordid SET DEFAULT nextval('public.record_recordid_seq'::regclass);


--
-- Name: record_exif record_exifid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_exif ALTER COLUMN record_exifid SET DEFAULT nextval('public.record_exif_record_exifid_seq'::regclass);


--
-- Name: record_file record_fileid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_file ALTER COLUMN record_fileid SET DEFAULT nextval('public.record_file_record_fileid_seq'::regclass);


--
-- Name: relation relationid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relation ALTER COLUMN relationid SET DEFAULT nextval('public.relation_relationid_seq'::regclass);


--
-- Name: share shareid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share ALTER COLUMN shareid SET DEFAULT nextval('public.share_shareid_seq'::regclass);


--
-- Name: share_activity share_activityid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity ALTER COLUMN share_activityid SET DEFAULT nextval('public.share_activity_share_activityid_seq'::regclass);


--
-- Name: shareby_url shareby_urlid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shareby_url ALTER COLUMN shareby_urlid SET DEFAULT nextval('public.shareby_url_shareby_urlid_seq'::regclass);


--
-- Name: sqs_task sqstaskid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sqs_task ALTER COLUMN sqstaskid SET DEFAULT nextval('public.sqs_task_sqstaskid_seq'::regclass);


--
-- Name: summary summaryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summary ALTER COLUMN summaryid SET DEFAULT nextval('public.summary_summaryid_seq'::regclass);


--
-- Name: system_report system_reportid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_report ALTER COLUMN system_reportid SET DEFAULT nextval('public.system_report_system_reportid_seq'::regclass);


--
-- Name: tag tagid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag ALTER COLUMN tagid SET DEFAULT nextval('public.tag_tagid_seq'::regclass);


--
-- Name: tag_link tag_linkid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_link ALTER COLUMN tag_linkid SET DEFAULT nextval('public.tag_link_tag_linkid_seq'::regclass);


--
-- Name: task_singleton tasksingletonid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_singleton ALTER COLUMN tasksingletonid SET DEFAULT nextval('public.task_singleton_tasksingletonid_seq'::regclass);


--
-- Name: taskthrottle taskthrottleid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taskthrottle ALTER COLUMN taskthrottleid SET DEFAULT nextval('public.taskthrottle_taskthrottleid_seq'::regclass);


--
-- Name: text_data text_dataid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.text_data ALTER COLUMN text_dataid SET DEFAULT nextval('public.text_data_text_dataid_seq'::regclass);


--
-- Name: zip zipid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zip ALTER COLUMN zipid SET DEFAULT nextval('public.zip_zipid_seq'::regclass);


--
-- Name: access idx_19143_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access
    ADD CONSTRAINT idx_19143_primary PRIMARY KEY (accessid);


--
-- Name: account idx_19150_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT idx_19150_primary PRIMARY KEY (accountid);


--
-- Name: account_allocation idx_19159_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_allocation
    ADD CONSTRAINT idx_19159_primary PRIMARY KEY (account_allocationid);


--
-- Name: account_archive idx_19166_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_archive
    ADD CONSTRAINT idx_19166_primary PRIMARY KEY (account_archiveid);


--
-- Name: account_promo idx_19173_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_promo
    ADD CONSTRAINT idx_19173_primary PRIMARY KEY (account_promoid);


--
-- Name: account_space idx_19180_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_space
    ADD CONSTRAINT idx_19180_primary PRIMARY KEY (account_spaceid);


--
-- Name: account_token idx_19187_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_token
    ADD CONSTRAINT idx_19187_primary PRIMARY KEY (account_tokenid);


--
-- Name: activity idx_19194_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT idx_19194_primary PRIMARY KEY (activityid);


--
-- Name: archive idx_19201_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archive
    ADD CONSTRAINT idx_19201_primary PRIMARY KEY (archiveid);


--
-- Name: archive_nbr idx_19210_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archive_nbr
    ADD CONSTRAINT idx_19210_primary PRIMARY KEY (archivenbrid);


--
-- Name: auth idx_19217_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth
    ADD CONSTRAINT idx_19217_primary PRIMARY KEY (authid);


--
-- Name: connector_facebook idx_19224_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_facebook
    ADD CONSTRAINT idx_19224_primary PRIMARY KEY (connector_facebookid);


--
-- Name: connector_familysearch idx_19231_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_familysearch
    ADD CONSTRAINT idx_19231_primary PRIMARY KEY (connector_familysearchid);


--
-- Name: connector_overview idx_19239_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_overview
    ADD CONSTRAINT idx_19239_primary PRIMARY KEY (connector_overviewid);


--
-- Name: contact idx_19246_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT idx_19246_primary PRIMARY KEY (contactid);


--
-- Name: daemon idx_19253_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daemon
    ADD CONSTRAINT idx_19253_primary PRIMARY KEY (daemonid);


--
-- Name: device idx_19260_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT idx_19260_primary PRIMARY KEY (deviceid);


--
-- Name: email idx_19267_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email
    ADD CONSTRAINT idx_19267_primary PRIMARY KEY (emailid);


--
-- Name: file idx_19274_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT idx_19274_primary PRIMARY KEY (fileid);


--
-- Name: folder idx_19281_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder
    ADD CONSTRAINT idx_19281_primary PRIMARY KEY (folderid);


--
-- Name: folder_link idx_19289_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_link
    ADD CONSTRAINT idx_19289_primary PRIMARY KEY (folder_linkid);


--
-- Name: folder_size idx_19296_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_size
    ADD CONSTRAINT idx_19296_primary PRIMARY KEY (folder_sizeid);


--
-- Name: idp_keys idx_19302_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idp_keys
    ADD CONSTRAINT idx_19302_primary PRIMARY KEY (idp_domain);


--
-- Name: invite idx_19310_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite
    ADD CONSTRAINT idx_19310_primary PRIMARY KEY (inviteid);


--
-- Name: invite_codes idx_19317_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT idx_19317_primary PRIMARY KEY (invitecodeid);


--
-- Name: invite_share idx_19324_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_share
    ADD CONSTRAINT idx_19324_primary PRIMARY KEY (invite_shareid);


--
-- Name: ledger_financial idx_19331_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_financial
    ADD CONSTRAINT idx_19331_primary PRIMARY KEY (ledger_financialid);


--
-- Name: ledger_nonfinancial idx_19338_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_nonfinancial
    ADD CONSTRAINT idx_19338_primary PRIMARY KEY (ledger_nonfinancialid);


--
-- Name: locn idx_19345_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locn
    ADD CONSTRAINT idx_19345_primary PRIMARY KEY (locnid);


--
-- Name: notification idx_19357_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT idx_19357_primary PRIMARY KEY (notificationid);


--
-- Name: preference idx_19364_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference
    ADD CONSTRAINT idx_19364_primary PRIMARY KEY (preferenceid);


--
-- Name: profile_item idx_19371_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_item
    ADD CONSTRAINT idx_19371_primary PRIMARY KEY (profile_itemid);


--
-- Name: promo idx_19378_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo
    ADD CONSTRAINT idx_19378_primary PRIMARY KEY (promoid);


--
-- Name: publishurl idx_19385_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publishurl
    ADD CONSTRAINT idx_19385_primary PRIMARY KEY (urlid);


--
-- Name: publish_ia idx_19394_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publish_ia
    ADD CONSTRAINT idx_19394_primary PRIMARY KEY (publish_iaid);


--
-- Name: record idx_19402_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record
    ADD CONSTRAINT idx_19402_primary PRIMARY KEY (recordid);


--
-- Name: record_exif idx_19411_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_exif
    ADD CONSTRAINT idx_19411_primary PRIMARY KEY (record_exifid);


--
-- Name: record_file idx_19418_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_file
    ADD CONSTRAINT idx_19418_primary PRIMARY KEY (record_fileid);


--
-- Name: relation idx_19425_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relation
    ADD CONSTRAINT idx_19425_primary PRIMARY KEY (relationid);


--
-- Name: share idx_19432_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share
    ADD CONSTRAINT idx_19432_primary PRIMARY KEY (shareid);


--
-- Name: shareby_url idx_19440_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shareby_url
    ADD CONSTRAINT idx_19440_primary PRIMARY KEY (shareby_urlid);


--
-- Name: share_activity idx_19448_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT idx_19448_primary PRIMARY KEY (share_activityid);


--
-- Name: sqs_task idx_19455_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sqs_task
    ADD CONSTRAINT idx_19455_primary PRIMARY KEY (sqstaskid);


--
-- Name: summary idx_19462_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summary
    ADD CONSTRAINT idx_19462_primary PRIMARY KEY (summaryid);


--
-- Name: system_report idx_19469_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_report
    ADD CONSTRAINT idx_19469_primary PRIMARY KEY (system_reportid);


--
-- Name: tag idx_19476_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT idx_19476_primary PRIMARY KEY (tagid);


--
-- Name: tag_link idx_19483_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_link
    ADD CONSTRAINT idx_19483_primary PRIMARY KEY (tag_linkid);


--
-- Name: taskthrottle idx_19490_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taskthrottle
    ADD CONSTRAINT idx_19490_primary PRIMARY KEY (taskthrottleid);


--
-- Name: task_singleton idx_19497_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_singleton
    ADD CONSTRAINT idx_19497_primary PRIMARY KEY (tasksingletonid);


--
-- Name: text_data idx_19504_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.text_data
    ADD CONSTRAINT idx_19504_primary PRIMARY KEY (text_dataid);


--
-- Name: timezone idx_19510_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timezone
    ADD CONSTRAINT idx_19510_primary PRIMARY KEY (timezoneid);


--
-- Name: zip idx_19516_primary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zip
    ADD CONSTRAINT idx_19516_primary PRIMARY KEY (zipid);


--
-- Name: idx_19143_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19143_archiveid ON public.access USING btree (archiveid);


--
-- Name: idx_19143_folder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19143_folder_linkid ON public.access USING btree (folder_linkid);


--
-- Name: idx_19150_primaryemail; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19150_primaryemail ON public.account USING btree (primaryemail);


--
-- Name: idx_19150_primaryemail_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19150_primaryemail_unique ON public.account USING btree (primaryemail);


--
-- Name: idx_19150_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19150_status ON public.account USING btree (status);


--
-- Name: idx_19150_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19150_subject ON public.account USING btree (subject);


--
-- Name: idx_19150_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19150_type ON public.account USING btree (type);


--
-- Name: idx_19150_updateddt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19150_updateddt ON public.account USING btree (updateddt);


--
-- Name: idx_19159_promoid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19159_promoid ON public.account_allocation USING btree (account_allocationid);


--
-- Name: idx_19166_accountid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19166_accountid ON public.account_archive USING btree (accountid);


--
-- Name: idx_19166_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19166_archiveid ON public.account_archive USING btree (archiveid);


--
-- Name: idx_19166_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19166_status ON public.account_archive USING btree (status);


--
-- Name: idx_19173_account_promo_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19173_account_promo_accountid_idx ON public.account_promo USING btree (accountid);


--
-- Name: idx_19173_account_promo_promoid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19173_account_promo_promoid_idx ON public.account_promo USING btree (promoid);


--
-- Name: idx_19173_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19173_name ON public.account_promo USING btree (type);


--
-- Name: idx_19180_account_space_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19180_account_space_accountid_idx ON public.account_space USING btree (accountid);


--
-- Name: idx_19180_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19180_name ON public.account_space USING btree (type);


--
-- Name: idx_19187_account_token_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19187_account_token_accountid_idx ON public.account_token USING btree (accountid);


--
-- Name: idx_19187_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19187_name ON public.account_token USING btree (type);


--
-- Name: idx_19194_accountid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19194_accountid ON public.activity USING btree (accountid);


--
-- Name: idx_19194_activity_refid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19194_activity_refid ON public.activity USING btree (refid);


--
-- Name: idx_19194_archivenbr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19194_archivenbr ON public.activity USING btree (archivenbr);


--
-- Name: idx_19194_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19194_type ON public.activity USING btree (type);


--
-- Name: idx_19194_updateddt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19194_updateddt ON public.activity USING btree (updateddt);


--
-- Name: idx_19201_archive_archivenbr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19201_archive_archivenbr ON public.archive USING btree (archivenbr);


--
-- Name: idx_19210_archivenbr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19210_archivenbr ON public.archive_nbr USING btree (archivenbr);


--
-- Name: idx_19210_archivepart; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19210_archivepart ON public.archive_nbr USING btree (archivepart);


--
-- Name: idx_19210_itempart; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19210_itempart ON public.archive_nbr USING btree (itempart);


--
-- Name: idx_19217_accountid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19217_accountid ON public.auth USING btree (accountid);


--
-- Name: idx_19217_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19217_archiveid ON public.auth USING btree (archiveid);


--
-- Name: idx_19217_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19217_token ON public.auth USING btree (token);


--
-- Name: idx_19217_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19217_type ON public.auth USING btree (type);


--
-- Name: idx_19224_connector_facebook_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19224_connector_facebook_archiveid_idx ON public.connector_facebook USING btree (archiveid);


--
-- Name: idx_19224_fbkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19224_fbkey ON public.connector_facebook USING btree (fbkey);


--
-- Name: idx_19224_reftable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19224_reftable ON public.connector_facebook USING btree (reftable, refid);


--
-- Name: idx_19224_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19224_status ON public.connector_facebook USING btree (status);


--
-- Name: idx_19231_connector_familysearch_accountid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19231_connector_familysearch_accountid ON public.connector_familysearch USING btree (byaccountid);


--
-- Name: idx_19231_connector_familysearch_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19231_connector_familysearch_archiveid ON public.connector_familysearch USING btree (toarchiveid);


--
-- Name: idx_19239_connector_overview_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19239_connector_overview_archiveid_idx ON public.connector_overview USING btree (archiveid);


--
-- Name: idx_19246_contactid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19246_contactid ON public.contact USING btree (contactid);


--
-- Name: idx_19260_device_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19260_device_accountid_idx ON public.device USING btree (accountid);


--
-- Name: idx_19260_device_deviceid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19260_device_deviceid ON public.device USING btree (deviceid);


--
-- Name: idx_19260_device_uuid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19260_device_uuid ON public.device USING btree (uuid);


--
-- Name: idx_19267_email_emailfdt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19267_email_emailfdt ON public.email USING gin (to_tsvector('simple'::regconfig, email));


--
-- Name: idx_19267_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19267_email_unique ON public.email USING btree (email);


--
-- Name: idx_19274_file_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19274_file_archiveid_idx ON public.file USING btree (archiveid);


--
-- Name: idx_19274_format; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19274_format ON public.file USING btree (format);


--
-- Name: idx_19281_archivenbr_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_archivenbr_index ON public.folder USING btree (archivenbr);


--
-- Name: idx_19281_archivenbr_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19281_archivenbr_unique ON public.folder USING btree (archivenbr);


--
-- Name: idx_19281_description; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_description ON public.folder USING gin (to_tsvector('simple'::regconfig, description));


--
-- Name: idx_19281_displaydt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_displaydt ON public.folder USING btree (displaydt);


--
-- Name: idx_19281_displayenddt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_displayenddt ON public.folder USING btree (displayenddt);


--
-- Name: idx_19281_displayname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_displayname ON public.folder USING gin (to_tsvector('simple'::regconfig, displayname));


--
-- Name: idx_19281_folder_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_folder_archiveid ON public.folder USING btree (archiveid);


--
-- Name: idx_19281_folder_locnid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_folder_locnid ON public.folder USING btree (locnid);


--
-- Name: idx_19281_folder_timezoneid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_folder_timezoneid ON public.folder USING btree (timezoneid);


--
-- Name: idx_19281_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19281_status ON public.folder USING btree (status);


--
-- Name: idx_19289_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_archiveid ON public.folder_link USING btree (archiveid);


--
-- Name: idx_19289_folderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_folderid ON public.folder_link USING btree (folderid);


--
-- Name: idx_19289_parentfolder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_parentfolder_linkid ON public.folder_link USING btree (parentfolder_linkid);


--
-- Name: idx_19289_parentfolderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_parentfolderid ON public.folder_link USING btree (parentfolderid);


--
-- Name: idx_19289_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_position ON public.folder_link USING btree ("position");


--
-- Name: idx_19289_recordid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_recordid ON public.folder_link USING btree (recordid);


--
-- Name: idx_19289_sharedt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_sharedt ON public.folder_link USING btree (sharedt);


--
-- Name: idx_19289_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_status ON public.folder_link USING btree (status);


--
-- Name: idx_19289_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19289_type ON public.folder_link USING btree (type);


--
-- Name: idx_19296_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_archiveid ON public.folder_size USING btree (archiveid);


--
-- Name: idx_19296_folder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_folder_linkid ON public.folder_size USING btree (folder_linkid);


--
-- Name: idx_19296_folder_sizeid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_folder_sizeid ON public.folder_size USING btree (folder_sizeid);


--
-- Name: idx_19296_folderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_folderid ON public.folder_size USING btree (folderid);


--
-- Name: idx_19296_parentfolder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_parentfolder_linkid ON public.folder_size USING btree (parentfolder_linkid);


--
-- Name: idx_19296_parentfolderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_parentfolderid ON public.folder_size USING btree (parentfolderid);


--
-- Name: idx_19296_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19296_type ON public.folder_size USING btree (type);


--
-- Name: idx_19310_inviteid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19310_inviteid ON public.invite USING btree (inviteid);


--
-- Name: idx_19317_codenameunique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19317_codenameunique ON public.invite_codes USING btree (codename);


--
-- Name: idx_19317_invitecodeid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19317_invitecodeid ON public.invite_codes USING btree (invitecodeid);


--
-- Name: idx_19324_inviteid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19324_inviteid ON public.invite_share USING btree (inviteid);


--
-- Name: idx_19331_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19331_name ON public.ledger_financial USING btree (type);


--
-- Name: idx_19338_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19338_name ON public.ledger_nonfinancial USING btree (type);


--
-- Name: idx_19345_geocodelookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19345_geocodelookup ON public.locn USING btree (geocodelookup);


--
-- Name: idx_19345_latitude; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19345_latitude ON public.locn USING btree (latitude);


--
-- Name: idx_19345_longitude; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19345_longitude ON public.locn USING btree (longitude);


--
-- Name: idx_19357_notification_fromaccountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notification_fromaccountid_idx ON public.notification USING btree (fromaccountid);


--
-- Name: idx_19357_notification_fromarchiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notification_fromarchiveid_idx ON public.notification USING btree (fromarchiveid);


--
-- Name: idx_19357_notification_toaccountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notification_toaccountid_idx ON public.notification USING btree (toaccountid);


--
-- Name: idx_19357_notification_toarchiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notification_toarchiveid_idx ON public.notification USING btree (toarchiveid);


--
-- Name: idx_19357_notificationid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notificationid ON public.notification USING btree (notificationid);


--
-- Name: idx_19357_notificatoin_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19357_notificatoin_status ON public.notification USING btree (status);


--
-- Name: idx_19364_preference_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19364_preference_accountid_idx ON public.preference USING btree (accountid);


--
-- Name: idx_19364_preference_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19364_preference_archiveid_idx ON public.preference USING btree (archiveid);


--
-- Name: idx_19371_fieldnameui; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19371_fieldnameui ON public.profile_item USING btree (fieldnameui);


--
-- Name: idx_19371_profile_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19371_profile_archiveid_idx ON public.profile_item USING btree (archiveid);


--
-- Name: idx_19371_profile_item_int1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19371_profile_item_int1 ON public.profile_item USING btree (int1);


--
-- Name: idx_19371_string1_ft_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19371_string1_ft_idx ON public.profile_item USING gin (to_tsvector('simple'::regconfig, string1));


--
-- Name: idx_19378_promoid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19378_promoid ON public.promo USING btree (promoid);


--
-- Name: idx_19385_urlid_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19385_urlid_unique ON public.publishurl USING btree (urlid);


--
-- Name: idx_19394_publish_ia_accountid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19394_publish_ia_accountid ON public.publish_ia USING btree (accountid);


--
-- Name: idx_19394_publish_ia_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19394_publish_ia_archiveid ON public.publish_ia USING btree (archiveid);


--
-- Name: idx_19394_publish_ia_folder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19394_publish_ia_folder_linkid ON public.publish_ia USING btree (folder_linkid);


--
-- Name: idx_19402_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_archiveid ON public.record USING btree (archiveid);


--
-- Name: idx_19402_archivenbr_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_archivenbr_index ON public.record USING btree (archivenbr);


--
-- Name: idx_19402_archivenbr_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19402_archivenbr_unique ON public.record USING btree (archivenbr);


--
-- Name: idx_19402_description; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_description ON public.record USING gin (to_tsvector('simple'::regconfig, description));


--
-- Name: idx_19402_displaydt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_displaydt ON public.record USING btree (displaydt);


--
-- Name: idx_19402_displayenddt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_displayenddt ON public.record USING btree (displayenddt);


--
-- Name: idx_19402_displayname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_displayname ON public.record USING gin (to_tsvector('simple'::regconfig, displayname));


--
-- Name: idx_19402_processeddt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_processeddt ON public.record USING btree (processeddt);


--
-- Name: idx_19402_publicdt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_publicdt ON public.record USING btree (publicdt);


--
-- Name: idx_19402_record_locnid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_record_locnid ON public.record USING btree (locnid);


--
-- Name: idx_19402_record_refarchivenbr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_record_refarchivenbr ON public.record USING btree (refarchivenbr);


--
-- Name: idx_19402_record_timezoneid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_record_timezoneid ON public.record USING btree (timezoneid);


--
-- Name: idx_19402_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19402_status ON public.record USING btree (status);


--
-- Name: idx_19411_record_exif_recordid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19411_record_exif_recordid ON public.record_exif USING btree (recordid);


--
-- Name: idx_19418_record_file_fileid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19418_record_file_fileid_idx ON public.record_file USING btree (fileid);


--
-- Name: idx_19418_recordid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19418_recordid ON public.record_file USING btree (recordid);


--
-- Name: idx_19425_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19425_archiveid ON public.relation USING btree (archiveid);


--
-- Name: idx_19425_publicdt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19425_publicdt ON public.relation USING btree (publicdt);


--
-- Name: idx_19425_relationarchiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19425_relationarchiveid ON public.relation USING btree (relationarchiveid);


--
-- Name: idx_19425_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19425_status ON public.relation USING gin (to_tsvector('simple'::regconfig, status));


--
-- Name: idx_19425_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19425_type ON public.relation USING gin (to_tsvector('simple'::regconfig, type));


--
-- Name: idx_19432_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19432_archiveid ON public.share USING btree (archiveid);


--
-- Name: idx_19432_folder_linkid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19432_folder_linkid ON public.share USING btree (folder_linkid);


--
-- Name: idx_19432_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19432_status ON public.share USING btree (status);


--
-- Name: idx_19440_byaccountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19440_byaccountid_idx ON public.shareby_url USING btree (byaccountid);


--
-- Name: idx_19440_byarchiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19440_byarchiveid_idx ON public.shareby_url USING btree (byarchiveid);


--
-- Name: idx_19440_folder_linkid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19440_folder_linkid_idx ON public.shareby_url USING btree (folder_linkid);


--
-- Name: idx_19448_affected_archive_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19448_affected_archive_id_idx ON public.share_activity USING btree (affectedarchiveid);


--
-- Name: idx_19448_modified_archive_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19448_modified_archive_id_idx ON public.share_activity USING btree (byarchiveid);


--
-- Name: idx_19448_owner_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19448_owner_accountid_idx ON public.share_activity USING btree (owneraccountid);


--
-- Name: idx_19448_owner_archive_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19448_owner_archive_id_idx ON public.share_activity USING btree (ownerarchiveid);


--
-- Name: idx_19448_updatedby_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19448_updatedby_accountid_idx ON public.share_activity USING btree (byaccountid);


--
-- Name: idx_19455_taskconstant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19455_taskconstant ON public.sqs_task USING btree (taskconstant);


--
-- Name: idx_19455_void; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19455_void ON public.sqs_task USING btree (void);


--
-- Name: idx_19462_summary_accountid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19462_summary_accountid_idx ON public.summary USING btree (accountid);


--
-- Name: idx_19462_summary_archiveid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19462_summary_archiveid_idx ON public.summary USING btree (archiveid);


--
-- Name: idx_19469_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19469_name ON public.system_report USING btree (type);


--
-- Name: idx_19476_archive_tag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19476_archive_tag ON public.tag USING btree (name, type, archiveid);


--
-- Name: idx_19476_fk_archiveid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19476_fk_archiveid ON public.tag USING btree (archiveid);


--
-- Name: idx_19476_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19476_name ON public.tag USING btree (name);


--
-- Name: idx_19483_tag_link_refid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19483_tag_link_refid ON public.tag_link USING btree (refid);


--
-- Name: idx_19483_tag_link_reftable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19483_tag_link_reftable ON public.tag_link USING btree (reftable);


--
-- Name: idx_19483_tagid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19483_tagid ON public.tag_link USING btree (tagid);


--
-- Name: idx_19483_unique_tag_link; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_19483_unique_tag_link ON public.tag_link USING btree (tagid, refid, reftable);


--
-- Name: idx_19497_refid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19497_refid ON public.task_singleton USING btree (refid);


--
-- Name: idx_19497_reftable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19497_reftable ON public.task_singleton USING btree (reftable);


--
-- Name: idx_19497_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19497_type ON public.task_singleton USING btree (type);


--
-- Name: idx_19504_refid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19504_refid_idx ON public.text_data USING btree (refid);


--
-- Name: idx_19504_reftable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19504_reftable_idx ON public.text_data USING gin (to_tsvector('simple'::regconfig, reftable));


--
-- Name: idx_19504_valuetxt_ft_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19504_valuetxt_ft_idx ON public.text_data USING gin (to_tsvector('simple'::regconfig, valuetext));


--
-- Name: idx_19510_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19510_status_idx ON public.timezone USING gin (to_tsvector('simple'::regconfig, status));


--
-- Name: idx_19510_stoffset_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19510_stoffset_idx ON public.timezone USING gin (to_tsvector('simple'::regconfig, stdoffset));


--
-- Name: idx_19510_tzplace_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19510_tzplace_idx ON public.timezone USING gin (to_tsvector('simple'::regconfig, timezoneplace));


--
-- Name: idx_19516_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_19516_name ON public.zip USING btree (name);


--
-- Name: account_archive account_archive_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_archive
    ADD CONSTRAINT account_archive_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: account_archive account_archive_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_archive
    ADD CONSTRAINT account_archive_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: account_promo account_promo_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_promo
    ADD CONSTRAINT account_promo_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: account_promo account_promo_promoid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_promo
    ADD CONSTRAINT account_promo_promoid FOREIGN KEY (promoid) REFERENCES public.promo(promoid);


--
-- Name: account_space account_space_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_space
    ADD CONSTRAINT account_space_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: account_token account_token_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_token
    ADD CONSTRAINT account_token_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: share_activity affectedarchiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT affectedarchiveid FOREIGN KEY (affectedarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: share_activity byaccountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT byaccountid FOREIGN KEY (byaccountid) REFERENCES public.account(accountid);


--
-- Name: shareby_url byaccountidfk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shareby_url
    ADD CONSTRAINT byaccountidfk FOREIGN KEY (byaccountid) REFERENCES public.account(accountid);


--
-- Name: share_activity byarchiveid1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT byarchiveid1 FOREIGN KEY (byarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: shareby_url byarchiveidfk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shareby_url
    ADD CONSTRAINT byarchiveidfk FOREIGN KEY (byarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: connector_facebook connector_facebook_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_facebook
    ADD CONSTRAINT connector_facebook_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: connector_familysearch connector_familysearch_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_familysearch
    ADD CONSTRAINT connector_familysearch_accountid FOREIGN KEY (byaccountid) REFERENCES public.account(accountid);


--
-- Name: connector_familysearch connector_familysearch_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_familysearch
    ADD CONSTRAINT connector_familysearch_archiveid FOREIGN KEY (toarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: connector_overview connector_overview_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connector_overview
    ADD CONSTRAINT connector_overview_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: device device_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: file file_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: tag fk_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT fk_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: folder_link folder_link_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_link
    ADD CONSTRAINT folder_link_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: folder_link folder_link_folderid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_link
    ADD CONSTRAINT folder_link_folderid FOREIGN KEY (folderid) REFERENCES public.folder(folderid);


--
-- Name: folder_link folder_link_recordid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_link
    ADD CONSTRAINT folder_link_recordid FOREIGN KEY (recordid) REFERENCES public.record(recordid);


--
-- Name: shareby_url folder_linkidfk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shareby_url
    ADD CONSTRAINT folder_linkidfk FOREIGN KEY (folder_linkid) REFERENCES public.folder_link(folder_linkid);


--
-- Name: folder_size folder_size_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_size
    ADD CONSTRAINT folder_size_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: folder_size folder_size_folder_linkid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_size
    ADD CONSTRAINT folder_size_folder_linkid FOREIGN KEY (folder_linkid) REFERENCES public.folder_link(folder_linkid);


--
-- Name: folder_size folder_size_folderid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folder_size
    ADD CONSTRAINT folder_size_folderid FOREIGN KEY (folderid) REFERENCES public.folder(folderid);


--
-- Name: notification notification_fromaccountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_fromaccountid FOREIGN KEY (fromaccountid) REFERENCES public.account(accountid);


--
-- Name: notification notification_fromarchiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_fromarchiveid FOREIGN KEY (fromarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: notification notification_toaccountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_toaccountid FOREIGN KEY (toaccountid) REFERENCES public.account(accountid);


--
-- Name: notification notification_toarchiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_toarchiveid FOREIGN KEY (toarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: share_activity owneraccountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT owneraccountid FOREIGN KEY (owneraccountid) REFERENCES public.account(accountid);


--
-- Name: share_activity ownerarchiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.share_activity
    ADD CONSTRAINT ownerarchiveid FOREIGN KEY (ownerarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: preference preference_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference
    ADD CONSTRAINT preference_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: preference preference_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference
    ADD CONSTRAINT preference_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: profile_item profile_item_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_item
    ADD CONSTRAINT profile_item_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: publish_ia publish_ia_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publish_ia
    ADD CONSTRAINT publish_ia_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: publish_ia publish_ia_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publish_ia
    ADD CONSTRAINT publish_ia_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: publish_ia publish_ia_folder_linkid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publish_ia
    ADD CONSTRAINT publish_ia_folder_linkid FOREIGN KEY (folder_linkid) REFERENCES public.folder_link(folder_linkid);


--
-- Name: record record_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record
    ADD CONSTRAINT record_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: record_file record_file_fileid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_file
    ADD CONSTRAINT record_file_fileid FOREIGN KEY (fileid) REFERENCES public.file(fileid);


--
-- Name: record_file record_file_recordid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.record_file
    ADD CONSTRAINT record_file_recordid FOREIGN KEY (recordid) REFERENCES public.record(recordid);


--
-- Name: relation relation_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relation
    ADD CONSTRAINT relation_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: relation relation_relationarchiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relation
    ADD CONSTRAINT relation_relationarchiveid FOREIGN KEY (relationarchiveid) REFERENCES public.archive(archiveid);


--
-- Name: summary summary_accountid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summary
    ADD CONSTRAINT summary_accountid FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: summary summary_archiveid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summary
    ADD CONSTRAINT summary_archiveid FOREIGN KEY (archiveid) REFERENCES public.archive(archiveid);


--
-- Name: tag_link tag_linktagid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_link
    ADD CONSTRAINT tag_linktagid FOREIGN KEY (tagid) REFERENCES public.tag(tagid);


--
-- PostgreSQL database dump complete
--

INSERT INTO public.timezone VALUES (1,'Greenwich Mean Time','Africa/Abidjan','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','CI','Ivory Coast','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(2,'Greenwich Mean Time','Africa/Accra','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','GH','Ghana','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(3,'Eastern Africa Time','Africa/Addis_Ababa','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','ET','Ethiopia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(4,'Central European Time','Africa/Algiers','Central European Time','CET','+01:00','Central European Time','CET','+01:00','DZ','Algeria','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(5,'Eastern Africa Time','Africa/Asmara','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','ER','Eritrea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(6,'Greenwich Mean Time','Africa/Bamako','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','ML','Mali','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(7,'West Africa Time','Africa/Bangui','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','CF','Central African Republic','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(8,'Greenwich Mean Time','Africa/Banjul','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','GM','Gambia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(9,'Greenwich Mean Time','Africa/Bissau','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','GW','Guinea-Bissau','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(10,'Central Africa Time','Africa/Blantyre','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','MW','Malawi','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(11,'West Africa Time','Africa/Brazzaville','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','CG','Republic of the Congo','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(12,'Central Africa Time','Africa/Bujumbura','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','BI','Burundi','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(13,'Eastern European Time','Africa/Cairo','Eastern European Time','EET','+02:00','Eastern European Time','EET','+02:00','EG','Egypt','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(14,'Western European Time','Africa/Casablanca','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','MA','Morocco','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(15,'Central European Time','Africa/Ceuta','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','ES','Spain','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(16,'Greenwich Mean Time','Africa/Conakry','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','GN','Guinea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(17,'Greenwich Mean Time','Africa/Dakar','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','SN','Senegal','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(18,'Eastern Africa Time','Africa/Dar_es_Salaam','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','TZ','Tanzania','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(19,'Eastern Africa Time','Africa/Djibouti','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','DJ','Djibouti','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(20,'West Africa Time','Africa/Douala','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','CM','Cameroon','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(21,'Western European Time','Africa/El_Aaiun','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','EH','Western Sahara','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(22,'Greenwich Mean Time','Africa/Freetown','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','SL','Sierra Leone','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(23,'Central Africa Time','Africa/Gaborone','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','BW','Botswana','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(24,'Central Africa Time','Africa/Harare','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','ZW','Zimbabwe','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(25,'South Africa Standard Time','Africa/Johannesburg','South Africa Standard Time','SAST','+02:00','South Africa Standard Time','SAST','+02:00','ZA','South Africa','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(26,'Eastern Africa Time','Africa/Juba','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','SS','South Sudan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(27,'Eastern Africa Time','Africa/Kampala','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','UG','Uganda','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(28,'Eastern Africa Time','Africa/Khartoum','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','SD','Sudan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(29,'Central Africa Time','Africa/Kigali','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','RW','Rwanda','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(30,'West Africa Time','Africa/Kinshasa','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','CD','Democratic Republic of the Congo','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(31,'West Africa Time','Africa/Lagos','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','NG','Nigeria','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(32,'West Africa Time','Africa/Libreville','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','GA','Gabon','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(33,'Greenwich Mean Time','Africa/Lome','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','TG','Togo','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(34,'West Africa Time','Africa/Luanda','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','AO','Angola','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(35,'Central Africa Time','Africa/Lubumbashi','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','CD','Democratic Republic of the Congo','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(36,'Central Africa Time','Africa/Lusaka','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','ZM','Zambia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(37,'West Africa Time','Africa/Malabo','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','GQ','Equatorial Guinea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(38,'Central Africa Time','Africa/Maputo','Central Africa Time','CAT','+02:00','Central Africa Time','CAT','+02:00','MZ','Mozambique','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(39,'South Africa Standard Time','Africa/Maseru','South Africa Standard Time','SAST','+02:00','South Africa Standard Time','SAST','+02:00','LS','Lesotho','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(40,'South Africa Standard Time','Africa/Mbabane','South Africa Standard Time','SAST','+02:00','South Africa Standard Time','SAST','+02:00','SZ','Swaziland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(41,'Eastern Africa Time','Africa/Mogadishu','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','SO','Somalia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(42,'Greenwich Mean Time','Africa/Monrovia','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','LR','Liberia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(43,'Eastern Africa Time','Africa/Nairobi','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','KE','Kenya','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(44,'West Africa Time','Africa/Ndjamena','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','TD','Chad','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(45,'West Africa Time','Africa/Niamey','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','NE','Niger','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(46,'Greenwich Mean Time','Africa/Nouakchott','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','MR','Mauritania','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(47,'Greenwich Mean Time','Africa/Ouagadougou','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','BF','Burkina Faso','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(48,'West Africa Time','Africa/Porto-Novo','West Africa Time','WAT','+01:00','West Africa Time','WAT','+01:00','BJ','Benin','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(49,'Greenwich Mean Time','Africa/Sao_Tome','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','ST','Sao Tome and Principe','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(50,'Eastern European Time','Africa/Tripoli','Eastern European Time','EET','+02:00','Eastern European Time','EET','+02:00','LY','Libya','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(51,'Central European Time','Africa/Tunis','Central European Time','CET','+01:00','Central European Time','CET','+01:00','TN','Tunisia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(52,'West Africa Time','Africa/Windhoek','West Africa Time','WAT','+01:00','West Africa Summer Time','WAST','+02:00','NA','Namibia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(53,'Hawaii-Aleutian Time','America/Adak','Hawaii-Aleutian Standard Time','HST','-10:00','Hawaii-Aleutian Daylight Time','HDT','-09:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(54,'Alaska Time','America/Anchorage','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-08:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(55,'Atlantic Time','America/Anguilla','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','AI','Anguilla','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(56,'Atlantic Time','America/Antigua','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','AG','Antigua and Barbuda','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(57,'Brasília Time','America/Araguaina','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(58,'Argentina Time','America/Argentina/Buenos_Aires','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(59,'Argentina Time','America/Argentina/Catamarca','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(60,'Argentina Time','America/Argentina/Cordoba','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(61,'Argentina Time','America/Argentina/Jujuy','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(62,'Argentina Time','America/Argentina/La_Rioja','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(63,'Argentina Time','America/Argentina/Mendoza','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(64,'Argentina Time','America/Argentina/Rio_Gallegos','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(65,'Argentina Time','America/Argentina/Salta','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(66,'Argentina Time','America/Argentina/San_Juan','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(67,'Argentina Time','America/Argentina/San_Luis','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(68,'Argentina Time','America/Argentina/Tucuman','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(69,'Argentina Time','America/Argentina/Ushuaia','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AR','Argentina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(70,'Atlantic Time','America/Aruba','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','AW','Aruba','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(71,'Paraguay Time','America/Asuncion','Paraguay Time','PYT','-04:00','Paraguay Summer Time','PYST','-03:00','PY','Paraguay','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(72,'Eastern Time','America/Atikokan','Eastern Standard Time','EST','-05:00','Eastern Standard Time','EST','-05:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(73,'Brasília Time','America/Bahia','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(74,'Central Time','America/Bahia_Banderas','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(75,'Atlantic Time','America/Barbados','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','BB','Barbados','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(76,'Brasília Time','America/Belem','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(77,'Central Time','America/Belize','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','BZ','Belize','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(78,'Atlantic Time','America/Blanc-Sablon','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(79,'Amazon Time','America/Boa_Vista','Amazon Time','AMT','-04:00','Amazon Time','AMT','-04:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(80,'Colombia Time','America/Bogota','Colombia Time','COT','-05:00','Colombia Time','COT','-05:00','CO','Colombia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(81,'Mountain Time','America/Boise','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(82,'Mountain Time','America/Cambridge_Bay','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(83,'Amazon Time','America/Campo_Grande','Amazon Time','AMT','-04:00','Amazon Summer Time','AMST','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(84,'Eastern Time','America/Cancun','Eastern Standard Time','CST','-05:00','Eastern Standard Time','CST','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(85,'Venezuela Time','America/Caracas','Venezuelan Standard Time','VET','-04:00','Venezuelan Standard Time','VET','-04:00','VE','Venezuela','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(86,'French Guiana Time','America/Cayenne','French Guiana Time','GFT','-03:00','French Guiana Time','GFT','-03:00','GF','French Guiana','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(87,'Eastern Time','America/Cayman','Eastern Standard Time','EST','-05:00','Eastern Standard Time','EST','-05:00','KY','Cayman Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(88,'Central Time','America/Chicago','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(89,'Mountain Time','America/Chihuahua','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(90,'Central Time','America/Costa_Rica','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','CR','Costa Rica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(91,'Mountain Time','America/Creston','Mountain Standard Time','MST','-07:00','Mountain Standard Time','MST','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(92,'Amazon Time','America/Cuiaba','Amazon Time','AMT','-04:00','Amazon Summer Time','AMST','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(93,'Atlantic Time','America/Curacao','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','CW','Curaçao','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(94,'Greenwich Mean Time','America/Danmarkshavn','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+0:00','GL','Greenland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(95,'Pacific Time','America/Dawson','Pacific Standard Time','PST','-08:00','Pacific Daylight Time','PDT','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(96,'Mountain Time','America/Dawson_Creek','Mountain Standard Time','MST','-07:00','Mountain Standard Time','MST','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(97,'Mountain Time','America/Denver','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(98,'Eastern Time','America/Detroit','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(99,'Atlantic Time','America/Dominica','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','DM','Dominica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(100,'Mountain Time','America/Edmonton','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(101,'Acre Time','America/Eirunepe','Acre Time','ACT','-05:00','Acre Time','ACT','-05:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(102,'Central Time','America/El_Salvador','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','SV','El Salvador','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(103,'Mountain Time','America/Fort_Nelson','Mountain Standard Time','MST','-07:00','Mountain Standard Time','MST','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(104,'Brasília Time','America/Fortaleza','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(105,'Atlantic Time','America/Glace_Bay','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(106,'West Greenland Time','America/Godthab','West Greenland Time','WGT','-03:00','Western Greenland Summer Time','WGST','-02:00','GL','Greenland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(107,'Atlantic Time','America/Goose_Bay','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(108,'Atlantic Standard Time','America/Grand_Turk','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','TC','Turks and Caicos Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(109,'Atlantic Time','America/Grenada','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','GD','Grenada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(110,'Atlantic Time','America/Guadeloupe','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','GP','Guadeloupe','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(111,'Central Time','America/Guatemala','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','GT','Guatemala','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(112,'Ecuador Time','America/Guayaquil','Ecuador Time','ECT','-05:00','Ecuador Time','ECT','-05:00','EC','Ecuador','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(113,'Guyana Time','America/Guyana','Guyana Time','GYT','-04:00','Guyana Time','GYT','-04:00','GY','Guyana','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(114,'Atlantic Time','America/Halifax','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(115,'Cuba','America/Havana','Cuba Standard Time','CST','-05:00','Cuba Daylight Time','CDT','-04:00','CU','Cuba','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(116,'Mountain Time','America/Hermosillo','Mountain Standard Time','MST','-07:00','Mountain Standard Time','MST','-07:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(117,'Eastern Time','America/Indiana/Indianapolis','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(118,'Central Time','America/Indiana/Knox','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(119,'Eastern Time','America/Indiana/Marengo','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(120,'Eastern Time','America/Indiana/Petersburg','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(121,'Central Time','America/Indiana/Tell_City','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(122,'Eastern Time','America/Indiana/Vevay','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(123,'Eastern Time','America/Indiana/Vincennes','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(124,'Eastern Time','America/Indiana/Winamac','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(125,'Mountain Time','America/Inuvik','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(126,'Eastern Time','America/Iqaluit','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(127,'Eastern Time','America/Jamaica','Eastern Standard Time','EST','-05:00','Eastern Standard Time','EST','-05:00','JM','Jamaica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(128,'Alaska Time','America/Juneau','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-08:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(129,'Eastern Time','America/Kentucky/Louisville','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(130,'Eastern Time','America/Kentucky/Monticello','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(131,'Atlantic Time','America/Kralendijk','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','BQ','Bonaire, Saint Eustatius and Saba','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(132,'Bolivia Time','America/La_Paz','Bolivia Time','BOT','-04:00','Bolivia Time','BOT','-04:00','BO','Bolivia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(133,'Peru Time','America/Lima','Peru Time','PET','-05:00','Peru Time','PET','-05:00','PE','Peru','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(134,'Pacific Time','America/Los_Angeles','Pacific Standard Time','PST','-08:00','Pacific Daylight Time','PDT','-07:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(135,'Atlantic Time','America/Lower_Princes','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','SX','Sint Maarten','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(136,'Brasília Time','America/Maceio','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(137,'Central Time','America/Managua','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','NI','Nicaragua','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(138,'Amazon Time','America/Manaus','Amazon Time','AMT','-04:00','Amazon Time','AMT','-04:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(139,'Atlantic Time','America/Marigot','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','MF','Saint Martin','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(140,'Atlantic Time','America/Martinique','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','MQ','Martinique','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(141,'Central Time','America/Matamoros','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(142,'Mountain Time','America/Mazatlan','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(143,'Central Time','America/Menominee','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(144,'Central Time','America/Merida','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(145,'Alaska Time','America/Metlakatla','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(146,'Central Time','America/Mexico_City','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(147,'Pierre and Miquelon Time','America/Miquelon','Pierre & Miquelon Standard Time','PMST','-03:00','Pierre & Miquelon Daylight Time','PMDT','-02:00','PM','Saint Pierre and Miquelon','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(148,'Atlantic Time','America/Moncton','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(149,'Central Time','America/Monterrey','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(150,'Uruguay Time','America/Montevideo','Uruguay Time','UYT','-03:00','Uruguay Time','UYT','-03:00','UY','Uruguay','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(151,'Atlantic Time','America/Montserrat','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','MS','Montserrat','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(152,'Eastern Time','America/Nassau','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','BS','Bahamas','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(153,'Eastern Time','America/New_York','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(154,'Eastern Time','America/Nipigon','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(155,'Alaska Time','America/Nome','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-08:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(156,'Fernando de Noronha Time','America/Noronha','Fernando de Noronha Time','FNT','-02:00','Fernando de Noronha Time','FNT','-02:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(157,'Central Time','America/North_Dakota/Beulah','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(158,'Central Time','America/North_Dakota/Center','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(159,'Central Time','America/North_Dakota/New_Salem','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(160,'Mountain Time','America/Ojinaga','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(161,'Eastern Time','America/Panama','Eastern Standard Time','EST','-05:00','Eastern Standard Time','EST','-05:00','PA','Panama','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(162,'Eastern Time','America/Pangnirtung','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(163,'Suriname Time','America/Paramaribo','Suriname Time','SRT','-03:00','Suriname Time','SRT','-03:00','SR','Suriname','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(164,'Mountain Time','America/Phoenix','Mountain Standard Time','MST','-07:00','Mountain Standard Time','MST','-07:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(165,'Atlantic Time','America/Port_of_Spain','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','TT','Trinidad and Tobago','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(166,'Eastern Time','America/Port-au-Prince','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','HT','Haiti','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(167,'Amazon Time','America/Porto_Velho','Amazon Time','AMT','-04:00','Amazon Time','AMT','-04:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(168,'Atlantic Time','America/Puerto_Rico','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','PR','Puerto Rico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(169,'Chile Time','America/Punta_Arenas','Chile Summer Time','CLST','-03:00','Chile Summer Time','CLST','-03:00','CL','Chile','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(170,'Central Time','America/Rainy_River','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(171,'Central Time','America/Rankin_Inlet','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(172,'Brasília Time','America/Recife','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(173,'Central Time','America/Regina','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(174,'Central Time','America/Resolute','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(175,'Acre Time','America/Rio_Branco','Acre Time','ACT','-05:00','Acre Time','ACT','-05:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(176,'Brasília Time','America/Santarem','Brasília Time','BRT','-03:00','Brasília Time','BRT','-03:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(177,'Chile Time','America/Santiago','Chile Standard Time','CLT','-04:00','Chile Summer Time','CLDT','-03:00','CL','Chile','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(178,'Atlantic Time','America/Santo_Domingo','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','DO','Dominican Republic','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(179,'Brasília Time','America/Sao_Paulo','Brasília Time','BRT','-03:00','Brasília Summer Time','BRST','-02:00','BR','Brazil','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(180,'Eastern Greenland Time','America/Scoresbysund','Eastern Greenland Time','EGT','-01:00','Eastern Greenland Summer Time','EGST','+00:00','GL','Greenland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(181,'Alaska Time','America/Sitka','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-08:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(182,'Atlantic Time','America/St_Barthelemy','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','BL','Saint Barthélemy','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(183,'Atlantic Time','America/St_Johns','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(184,'Atlantic Time','America/St_Kitts','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','KN','Saint Kitts and Nevis','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(185,'Atlantic Time','America/St_Lucia','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','LC','Saint Lucia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(186,'Atlantic Time','America/St_Thomas','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','VI','U.S. Virgin Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(187,'Atlantic Time','America/St_Vincent','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','VC','Saint Vincent and the Grenadines','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(188,'Central Time','America/Swift_Current','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(189,'Central Time','America/Tegucigalpa','Central Standard Time','CST','-06:00','Central Standard Time','CST','-06:00','HN','Honduras','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(190,'Atlantic Time','America/Thule','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','GL','Greenland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(191,'Eastern Time','America/Thunder_Bay','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(192,'Pacific Time','America/Tijuana','Pacific Standard Time','PST','-08:00','Pacific Daylight Time','PDT','-07:00','MX','Mexico','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(193,'Eastern Time','America/Toronto','Eastern Standard Time','EST','-05:00','Eastern Daylight Time','EDT','-04:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(194,'Atlantic Time','America/Tortola','Atlantic Standard Time','AST','-04:00','Atlantic Standard Time','AST','-04:00','VG','British Virgin Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(195,'Pacific Time','America/Vancouver','Pacific Standard Time','PST','-08:00','Pacific Daylight Time','PDT','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(196,'Pacific Time','America/Whitehorse','Pacific Standard Time','PST','-08:00','Pacific Daylight Time','PDT','-07:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(197,'Central Time','America/Winnipeg','Central Standard Time','CST','-06:00','Central Daylight Time','CDT','-05:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(198,'Alaska Time','America/Yakutat','Alaska Standard Time','AKST','-09:00','Alaska Daylight Time','AKDT','-08:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(199,'Mountain Time','America/Yellowknife','Mountain Standard Time','MST','-07:00','Mountain Daylight Time','MDT','-06:00','CA','Canada','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(200,'Casey Time','Antarctica/Casey','Casey Time','CAST','+8:00','Casey Time','CAST','+11:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(201,'Davis Time','Antarctica/Davis','Davis Time','DAVT','+07:00','Davis Time','DAVT','+07:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(202,'Dumont-d''Urville Time','Antarctica/DumontDUrville','Dumont-d''Urville Time','DDUT','+10:00','Dumont-d''Urville Time','DDUT','+10:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(203,'Macquarie Time','Antarctica/Macquarie','Macquarie Time','MIST','+11:00','Macquarie Time','MIST','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(204,'Mawson Time','Antarctica/Mawson','Mawson Time','MAWT','+05:00','Mawson Time','MAWT','+05:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(205,'New Zealand Time','Antarctica/McMurdo','New Zealand Standard Time','NZST','+12:00','New Zealand Daylight Time','NZDT','+13:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(206,'Chile Time','Antarctica/Palmer','Chile Summer Time','CLST','-03:00','Chile Summer Time','CLST','-03:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(207,'Argentina Time','Antarctica/Rothera','Argentina Time','ART','-03:00','Argentina Time','ART','-03:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(208,'Syowa Time','Antarctica/Syowa','Syowa Time','SYOT','+03:00','Syowa Time','SYOT','+03:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(209,'Greenwich Mean Time','Antarctica/Troll','Greenwich Mean Time','GMT','+00:00','Central European Summer Time','CEST','+02:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(210,'Vostok Time','Antarctica/Vostok','Vostok Time','VOST','+06:00','Vostok Time','VOST','+06:00','AQ','Antarctica','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(211,'Central European Time','Arctic/Longyearbyen','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','SJ','Svalbard and Jan Mayen','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(212,'Arabia Time','Asia/Aden','Arabia Standard Time','AST','+03:00','Arabia Standard Time','AST','+03:00','YE','Yemen','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(213,'Alma-Ata Time','Asia/Almaty','Alma-Ata Time','ALMT','+06:00','Alma-Ata Time','ALMT','+06:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(214,'Arabia Time','Asia/Amman','Arabia Standard Time','AST','+02:00','Arabia Daylight Time','ADT','+03:00','JO','Jordan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(215,'Anadyr Time','Asia/Anadyr','Anadyr Time','ANAT','+12:00','Anadyr Time','ANAT','+12:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(216,'Oral Time','Asia/Aqtau','Oral Time','ORAT','+05:00','Oral Time','ORAT','+05:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(217,'Aqtobe Time','Asia/Aqtobe','Aqtobe Time','AQTT','+05:00','Aqtobe Time','AQTT','+05:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(218,'Turkmenistan Time','Asia/Ashgabat','Turkmenistan Time','TMT','+05:00','Turkmenistan Time','TMT','+05:00','TM','Turkmenistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(219,'Atyrau Time','Asia/Atyrau','Atyrau Time','AQTT','+05:00','Atyrau Time','AQTT','+05:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(220,'Arabia Time','Asia/Baghdad','Arabia Standard Time','AST','+03:00','Arabia Standard Time','AST','+03:00','IQ','Iraq','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(221,'Arabia Time','Asia/Bahrain','Arabia Standard Time','AST','+04:00','Arabia Standard Time','AST','+03:00','BH','Bahrain','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(222,'Azerbaijan Time','Asia/Baku','Azerbaijan Time','AZT','+04:00','Azerbaijan Time','AZT','+04:00','AZ','Azerbaijan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(223,'Indochina Time','Asia/Bangkok','Indochina Time','ICT','+07:00','Indochina Time','ICT','+07:00','TH','Thailand','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(224,'MSK+4','Asia/Barnaul','MSK+4','MSK+4','+07:00','MSK+4','MSK+4','+07:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(225,'Eastern European Time','Asia/Beirut','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','LB','Lebanon','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(226,'Kyrgyzstan Time','Asia/Bishkek','Kyrgyzstan Time','KGT','+06:00','Kyrgyzstan Time','KGT','+06:00','KG','Kyrgyzstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(227,'Brunei Darussalam Time','Asia/Brunei','Brunei Darussalam Time','BNT','+08:00','Brunei Darussalam Time','BNT','+08:00','BN','Brunei','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(228,'Yakutsk Time','Asia/Chita','Yakutsk Time','IRKT','+09:00','Yakutsk Time','IRKT','+09:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(229,'Choibalsan Time','Asia/Choibalsan','Choibalsan Time','CHOT','+08:00','Choibalsan Time','CHOT','+08:00','MN','Mongolia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(230,'India Time','Asia/Colombo','India Standard Time','IST','+05:30','India Standard Time','IST','+05:30','LK','Sri Lanka','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(231,'Eastern European Time','Asia/Damascus','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','SY','Syria','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(232,'Bangladesh Time','Asia/Dhaka','Bangladesh Standard Time','BST','+06:00','Bangladesh Standard Time','BST','+06:00','BD','Bangladesh','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(233,'East Timor Time','Asia/Dili','East Timor Time','TLT','+09:00','East Timor Time','TLT','+09:00','TL','East Timor','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(234,'Gulf Time','Asia/Dubai','Gulf Standard Time','GST','+04:00','Gulf Standard Time','GST','+04:00','AE','United Arab Emirates','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(235,'Tajikistan Time','Asia/Dushanbe','Tajikistan Time','TJT','+05:00','Tajikistan Time','TJT','+05:00','TJ','Tajikistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(236,'Turkey Time','Asia/Famagusta','Turkey Time','TRT','+03:00','Turkey Time','TRT','+03:00','CY','Cyprus','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(237,'Eastern European Time','Asia/Gaza','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','PS','Palestinian Territory','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(238,'Eastern European Time','Asia/Hebron','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','PS','Palestinian Territory','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(239,'Indochina Time','Asia/Ho_Chi_Minh','Indochina Time','ICT','+07:00','Indochina Time','ICT','+07:00','VN','Vietnam','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(240,'Hong Kong Time','Asia/Hong_Kong','Hong Kong Time','HKT','+08:00','Hong Kong Time','HKT','+08:00','HK','Hong Kong','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(241,'Hovd Time','Asia/Hovd','Hovd Time','HOVT','+07:00','Hovd Time','HOVT','+07:00','MN','Mongolia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(242,'Irkutsk Time','Asia/Irkutsk','Irkutsk Time','IRKT','+08:00','Irkutsk Time','IRKT','+08:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(243,'Western Indonesian Time','Asia/Jakarta','Western Indonesian Time','WIB','+07:00','Western Indonesian Time','WIB','+07:00','ID','Indonesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(244,'Western Indonesian Time','Asia/Jayapura','Western Indonesian Time','WIB','+09:00','Western Indonesian Time','WIB','+09:00','ID','Indonesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(245,'Israel Time','Asia/Jerusalem','Israel Standard Time','IST','+02:00','Israel Daylight Time','IDT','+03:00','IL','Israel','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(246,'Afghanistan Time','Asia/Kabul','Afghanistan Time','AFT','+04:30','Afghanistan Time','AFT','+04:30','AF','Afghanistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(247,'Kamchatka Time','Asia/Kamchatka','Kamchatka Time','PETT','+12:00','Kamchatka Time','PETT','+12:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(248,'Pakistan Time','Asia/Karachi','Pakistan Standard Time','PKT','+05:00','Pakistan Standard Time','PKT','+05:00','PK','Pakistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(249,'Nepal Time','Asia/Kathmandu','Nepal Time','NPT','+05:45','Nepal Time','NPT','+05:45','NP','Nepal','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(250,'Yakutsk Time','Asia/Khandyga','Yakutsk Time','YAKT','+09:00','Yakutsk Time','YAKT','+09:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(251,'India Time','Asia/Kolkata','India Standard Time','IST','+05:30','India Standard Time','IST','+05:30','IN','India','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(252,'Krasnoyarsk Time','Asia/Krasnoyarsk','Krasnoyarsk Time','KRAT','+07:00','Krasnoyarsk Time','KRAT','+07:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(253,'Malaysia Time','Asia/Kuala_Lumpur','Malaysia Time','MYT','+08:00','Malaysia Time','MYT','+08:00','MY','Malaysia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(254,'Malaysia Time','Asia/Kuching','Malaysia Time','MYT','+08:00','Malaysia Time','MYT','+08:00','MY','Malaysia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(255,'Arabia Time','Asia/Kuwait','Arabia Standard Time','AST','+03:00','Arabia Standard Time','AST','+03:00','KW','Kuwait','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(256,'China Time','Asia/Macau','China Time','CST','+08:00','China Time','CST','+08:00','MO','Macao','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(257,'Magadan Time','Asia/Magadan','Magadan Time','MAGT','+11:00','Magadan Time','MAGT','+11:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(258,'Central Indonesian Time','Asia/Makassar','Central Indonesian Time','CITA','+08:00','Central Indonesian Time','CITA','+08:00','ID','Indonesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(259,'Philippine Time','Asia/Manila','Philippine Time','PHT','+08:00','Philippine Time','PHT','+08:00','PH','Philippines','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(260,'Gulf Time','Asia/Muscat','Gulf Standard Time','GST','+04:00','Gulf Standard Time','GST','+04:00','OM','Oman','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(261,'Eastern European Time','Asia/Nicosia','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','CY','Cyprus','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(262,'Krasnoyarsk Time','Asia/Novokuznetsk','Krasnoyarsk Time','KRAT','+07:00','Krasnoyarsk Time','KRAT','+07:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(263,'Novosibirsk Time','Asia/Novosibirsk','Novosibirsk Time','NOVT','+07:00','Novosibirsk Time','NOVT','+07:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(264,'Omsk Time','Asia/Omsk','Omsk Standard Time','OMST','+06:00','Omsk Standard Time','OMST','+06:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(265,'Oral Time','Asia/Oral','Oral Time','ORAT','+05:00','Oral Time','ORAT','+05:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(266,'Indochina Time','Asia/Phnom_Penh','Indochina Time','ICT','+07:00','Indochina Time','ICT','+07:00','KH','Cambodia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(267,'Western Indonesian Time','Asia/Pontianak','Western Indonesian Time','WIB','+07:00','Western Indonesian Time','WIB','+07:00','ID','Indonesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(268,'Pyongyang Time','Asia/Pyongyang','Pyongyang Time','PYT','+08:30','Pyongyang Time','PYT','+08:30','KP','North Korea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(269,'Arabia Time','Asia/Qatar','Arabia Standard Time','AST','+04:00','Arabia Standard Time','AST','+03:00','QA','Qatar','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(270,'Qyzylorda Time','Asia/Qyzylorda','Qyzylorda Time','QYZT','+06:00','Qyzylorda Time','QYZT','+06:00','KZ','Kazakhstan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(271,'Arabia Time','Asia/Riyadh','Arabia Standard Time','AST','+03:00','Arabia Standard Time','AST','+03:00','SA','Saudi Arabia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(272,'Sakhalin Time','Asia/Sakhalin','Sakhalin Time','SAKT','+11:00','Sakhalin Time','SAKT','+11:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(273,'Uzbekistan Time','Asia/Samarkand','Uzbekistan Time','UZT','+05:00','Uzbekistan Time','UZT','+05:00','UZ','Uzbekistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(274,'Korea Time','Asia/Seoul','Korea Standard Time','KST','+09:00','Korea Standard Time','KST','+09:00','KR','South Korea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(275,'China Time','Asia/Shanghai','China Time','CST','+08:00','China Time','CST','+08:00','CN','China','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(276,'Singapore Time','Asia/Singapore','Singapore Time','SGT','+08:00','Singapore Time','SGT','+08:00','SG','Singapore','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(277,'Srednekolymsk Time','Asia/Srednekolymsk','Srednekolymsk Time','SRET','+11:00','Srednekolymsk Time','SRET','+11:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(278,'China Time','Asia/Taipei','China Time','CST','+08:00','China Time','CST','+08:00','TW','Taiwan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(279,'Uzbekistan Time','Asia/Tashkent','Uzbekistan Time','UZT','+05:00','Uzbekistan Time','UZT','+05:00','UZ','Uzbekistan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(280,'Georgia Time','Asia/Tbilisi','Georgia Standard Time','GST','+04:00','Georgia Standard Time','GST','+04:00','GE','Georgia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(281,'Iran Time','Asia/Tehran','Iran Standard Time','IRST','+03:30','Iran Daylight Time','IRDT','+04:30','IR','Iran','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(282,'Bhutan Time','Asia/Thimphu','Bhutan Time','BTT','+06:00','Bhutan Time','BTT','+06:00','BT','Bhutan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(283,'Japan Time','Asia/Tokyo','Japan Standard Time','JST','+09:00','Japan Standard Time','JST','+09:00','JP','Japan','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(284,'MSK+4','Asia/Tomsk','MSK+4','MSK+4','+07:00','MSK+4','MSK+4','+07:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(285,'Ulaanbaatar Time','Asia/Ulaanbaatar','Ulaanbaatar Time','ULAT','+08:00','Ulaanbaatar Time','ULAT','+08:00','MN','Mongolia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(286,'China Time','Asia/Urumqi','China Standard Time','CST','+06:00','China Standard Time','CST','+06:00','CN','China','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(287,'Vladivostok Time','Asia/Ust-Nera','Vladivostok Time','VLAT','+10:00','Vladivostok Time','VLAT','+10:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(288,'Indochina Time','Asia/Vientiane','Indochina Time','ICT','+07:00','Indochina Time','ICT','+07:00','LA','Laos','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(289,'Vladivostok Time','Asia/Vladivostok','Vladivostok Time','VLAT','+10:00','Vladivostok Time','VLAT','+10:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(290,'Yakutsk Time','Asia/Yakutsk','Yakusk Time','YAKT','+09:00','Yakusk Time','YAKT','+09:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(291,'Myanmar','Asia/Yangon','Myanmar Time','MMT','+06:30','Myanmar Time','MMT','+06:30','MM','Myanmar','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(292,'Yekaterinburg Time','Asia/Yekaterinburg','Yekaterinburg Time','YEKT','+05:00','Yekaterinburg Time','YEKT','+05:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(293,'Armenia Time','Asia/Yerevan','Armenia Time','AMT','+04:00','Armenia Time','AMT','+04:00','AM','Armenia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(294,'Azores Time','Atlantic/Azores','Azores Time','AZOT','-01:00','Azores Summer Time','AZOST','+00:00','PT','Portugal','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(295,'Atlantic Time','Atlantic/Bermuda','Atlantic Standard Time','AST','-04:00','Atlantic Daylight Time','ADT','-03:00','BM','Bermuda','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(296,'Western European Time','Atlantic/Canary','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','ES','Spain','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(297,'Cape Verde Time','Atlantic/Cape_Verde','Cape Verde Time','CVT','-01:00','Cape Verde Time','CVT','-01:00','CV','Cape Verde','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(298,'Western European Time','Atlantic/Faroe','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','FO','Faroe Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(299,'Western European Time','Atlantic/Madeira','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','PT','Portugal','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(300,'Greenwich Mean Time','Atlantic/Reykjavik','Greenwich Mean Time','GMT','+0:00','Greenwich Mean Time','GMT','+00:00','IS','Iceland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(301,'South Georgia Time','Atlantic/South_Georgia','South Georgia Time','GST','-02:00','South Georgia Time','GST','-02:00','GS','South Georgia and the South Sandwich Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(302,'Central European Time','Atlantic/St_Helena','Central European Time','CET','+1:00','Central European Summer Time','CEST','+2:00','SH','Saint Helena','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(303,'Falkland Islands Time','Atlantic/Stanley','Falkland Islands Summer Time','FKST','-03:00','Falkland Islands Summer Time','FKST','-03:00','FK','Falkland Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(304,'Australian Central Time','Australia/Adelaide','Australian Central Standard Time','ACST','+09:30','Australian Central Daylight Time','ACDT','+10:30','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(305,'Australian Eastern Time','Australia/Brisbane','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Standard Time','AEST','+10:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(306,'Australian Central Time','Australia/Broken_Hill','Australian Central Standard Time','ACST','+09:30','Australian Central Daylight Time','ACDT','+10:30','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(307,'Australian Eastern Time','Australia/Currie','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Daylight Time','AEDT','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(308,'Australian Central Time','Australia/Darwin','Australian Central Standard Time','ACST','+09:30','Australian Central Standard Time','ACST','+09:30','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(309,'Australian Central Western Time','Australia/Eucla','Australian Central Western Standard Time','ACWST','+08:45','Australian Central Western Standard Time','ACWST','+08:45','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(310,'Australian Eastern Time','Australia/Hobart','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Daylight Time','AEDT','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(311,'Australian Eastern Time','Australia/Lindeman','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Standard Time','AEST','+10:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(312,'Lord Howe Time','Australia/Lord_Howe','Lord Howe Standard Time','LHST','+10:30','Lord Howe Daylight Time','LHDT','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(313,'Australian Eastern Time','Australia/Melbourne','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Daylight Time','AEDT','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(314,'AustralianWestern Time','Australia/Perth','Australian Western Standard Time','AWST','+08:00','Australian Western Standard Time','AWST','+08:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(315,'Australian Eastern Time','Australia/Sydney','Australian Eastern Standard Time','AEST','+10:00','Australian Eastern Daylight Time','AEDT','+11:00','AU','Australia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(316,'Central European Time','Europe/Amsterdam','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','NL','Netherlands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(317,'Central European Time','Europe/Andorra','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','AD','Andorra','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(318,'MSK+1','Europe/Astrakhan','MSK+1','MSK+1','+04:00','MSK+1','MSK+1','+04:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(319,'Eastern European Time','Europe/Athens','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','GR','Greece','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(320,'Central European Time','Europe/Belgrade','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','RS','Serbia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(321,'Central European Time','Europe/Berlin','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','DE','Germany','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(322,'Central European Time','Europe/Bratislava','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','SK','Slovakia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(323,'Central European Time','Europe/Brussels','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','BE','Belgium','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(324,'Eastern European Time','Europe/Bucharest','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','RO','Romania','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(325,'Central European Time','Europe/Budapest','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','HU','Hungary','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(326,'Central European Time','Europe/Busingen','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','DE','Germany','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(327,'Eastern European Time','Europe/Chisinau','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','MD','Moldova','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(328,'Central European Time','Europe/Copenhagen','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','DK','Denmark','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(329,'Irish Time','Europe/Dublin','Greenwich Mean Time','GMT','+0:00','Irish Standard Time','IST','+01:00','IE','Ireland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(330,'Central European Time','Europe/Gibraltar','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','GI','Gibraltar','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(331,'British Time','Europe/Guernsey','Greenwich Mean Time','GMT','+0:00','British Summer Time','BST','+01:00','GG','Guernsey','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(332,'Eastern European Time','Europe/Helsinki','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','FI','Finland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(333,'British Time','Europe/Isle_of_Man','Greenwich Mean Time','GMT','+0:00','British Summer Time','BST','+01:00','IM','Isle of Man','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(334,'Turkey Time','Europe/Istanbul','Turkey Time','TRT','+03:00','Turkey Time','TRT','+03:00','TR','Turkey','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(335,'British Time','Europe/Jersey','Greenwich Mean Time','GMT','+0:00','British Summer Time','BST','+01:00','JE','Jersey','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(336,'Eastern European Time','Europe/Kaliningrad','Eastern European Time','EET','+02:00','Eastern European Time','EET','+02:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(337,'Eastern European Time','Europe/Kiev','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','UA','Ukraine','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(338,'Moscow Time','Europe/Kirov','Moscow Standard Time','MSK','+03:00','Moscow Standard Time','MSK','+03:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(339,'Western European Time','Europe/Lisbon','Western European Time','WET','+0:00','Western European Summer Time','WEST','+01:00','PT','Portugal','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(340,'Central European Time','Europe/Ljubljana','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','SI','Slovenia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(341,'British Time','Europe/London','Greenwich Mean Time','GMT','+0:00','British Summer Time','BST','+01:00','GB','United Kingdom','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(342,'Central European Time','Europe/Luxembourg','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','LU','Luxembourg','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(343,'Central European Time','Europe/Madrid','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','ES','Spain','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(344,'Central European Time','Europe/Malta','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','MT','Malta','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(345,'Eastern European Time','Europe/Mariehamn','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','AX','Aland Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(346,'Moscow Time','Europe/Minsk','Moscow Standard Time','MSK','+03:00','Moscow Standard Time','MSK','+03:00','BY','Belarus','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(347,'Central European Time','Europe/Monaco','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','MC','Monaco','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(348,'Moscow Time','Europe/Moscow','Moscow Standard Time','MSK','+03:00','Moscow Standard Time','MSK','+03:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(349,'Central European Time','Europe/Oslo','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','NO','Norway','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(350,'Central European Time','Europe/Paris','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','FR','France','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(351,'Central European Time','Europe/Podgorica','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','ME','Montenegro','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(352,'Central European Time','Europe/Prague','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','CZ','Czech Republic','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(353,'Eastern European Time','Europe/Riga','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','LV','Latvia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(354,'Central European Time','Europe/Rome','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','IT','Italy','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(355,'Samara Time','Europe/Samara','Samara Time','SAMT','+04:00','Samara Time','SAMT','+04:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(356,'Central European Time','Europe/San_Marino','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','SM','San Marino','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(357,'Central European Time','Europe/Sarajevo','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','BA','Bosnia and Herzegovina','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(358,'MSK+1','Europe/Saratov','MSK+1','MSK+1','+04:00','MSK+1','MSK+1','+04:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(359,'Moscow Time','Europe/Simferopol','Moscow Standard Time','MSK','+03:00','Moscow Standard Time','MSK','+03:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(360,'Central European Time','Europe/Skopje','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','MK','Macedonia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(361,'Eastern European Time','Europe/Sofia','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','BG','Bulgaria','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(362,'Central European Time','Europe/Stockholm','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','SE','Sweden','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(363,'Eastern European Time','Europe/Tallinn','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','EE','Estonia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(364,'Central European Time','Europe/Tirane','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','AL','Albania','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(365,'MSK+1','Europe/Ulyanovsk','MSK+1','MSK+1','+04:00','MSK+1','MSK+1','+04:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(366,'Eastern European Time','Europe/Uzhgorod','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','UA','Ukraine','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(367,'Central European Time','Europe/Vaduz','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','LI','Liechtenstein','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(368,'Central European Time','Europe/Vatican','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','VA','Vatican','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(369,'Central European Time','Europe/Vienna','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','AT','Austria','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(370,'Eastern European Time','Europe/Vilnius','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','LT','Lithuania','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(371,'Moscow Time','Europe/Volgograd','Moscow Standard Time','MSK','+03:00','Moscow Standard Time','MSK','+03:00','RU','Russia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(372,'Central European Time','Europe/Warsaw','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','PL','Poland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(373,'Central European Time','Europe/Zagreb','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','HR','Croatia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(374,'Eastern European Time','Europe/Zaporozhye','Eastern European Time','EET','+02:00','Eastern European Summer Time','EEST','+03:00','UA','Ukraine','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(375,'Central European Time','Europe/Zurich','Central European Time','CET','+01:00','Central European Summer Time','CEST','+02:00','CH','Switzerland','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(376,'Eastern Africa Time','Indian/Antananarivo','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','MG','Madagascar','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(377,'Mauritius Time','Indian/Chagos','Mauritius Time','MUT','+04:00','Mauritius Time','MUT','+04:00','IO','British Indian Ocean Territory','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(378,'Line Islands Time','Indian/Christmas','Line Islands Time','LINT','+07:00','Line Islands Time','LINT','+07:00','CX','Christmas Island','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(379,'Cocos Islands Time','Indian/Cocos','Cocos Islands Time','CCT','+06:30','Cocos Islands Time','CCT','+06:30','CC','Cocos Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(380,'Eastern Africa Time','Indian/Comoro','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','KM','Comoros','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(381,'French Southern and Antarctic Time','Indian/Kerguelen','French Southern and Antarctic Time','TFT','+05:00','French Southern and Antarctic Time','TFT','+05:00','TF','French Southern Territories','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(382,'Seychelles Time','Indian/Mahe','Seychelles Time','SCT','+04:00','Seychelles Time','SCT','+04:00','SC','Seychelles','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(383,'Maldives Time','Indian/Maldives','Maldives Time','MVT','+05:00','Maldives Time','MVT','+05:00','MV','Maldives','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(384,'Mauritius Time','Indian/Mauritius','Mauritius Time','MUT','+04:00','Mauritius Time','MUT','+04:00','MU','Mauritius','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(385,'Eastern Africa Time','Indian/Mayotte','Eastern Africa Time','EAT','+03:00','Eastern Africa Time','EAT','+03:00','YT','Mayotte','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(386,'Reunion Time','Indian/Reunion','Reunion Time','RET','+04:00','Reunion Time','RET','+04:00','RE','Reunion','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(387,'West Samoa Time','Pacific/Apia','West Samoa Time','WST','+13:00','West Samoa Time','WST','+14:00','WS','Samoa','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(388,'New Zealand Time','Pacific/Auckland','New Zealand Standard Time','NZST','+13:00','New Zealand Daylight Time','NZDT','+13:00','NZ','New Zealand','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(389,'Bougainville Time','Pacific/Bougainville','Bougainville Standard Time','BST','+11:00','Bougainville Standard Time','BST','+11:00','PG','Papua New Guinea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(390,'Chatham Island Time','Pacific/Chatham','Chatham Island Standard Time','CHAST','+12:45','Chatham Island Daylight Time','CHADT','+13:45','NZ','New Zealand','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(391,'Chuuk Time','Pacific/Chuuk','Chuuk Time','CHUT','+10:00','Chuuk Time','CHUT','+10:00','FM','Micronesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(392,'Easter Island Time','Pacific/Easter','Easter Island Standard Time','EAST','-06:00','Easter Island Summer Time','EEAST','-05:00','CL','Chile','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(393,'Vanuatu Time','Pacific/Efate','Vanuatu Time','VUT','+11:00','Vanuatu Time','VUT','+11:00','VU','Vanuatu','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(394,'Phoenix Island Time','Pacific/Enderbury','Phoenix Island Time','PHOT','+13:00','Phoenix Island Time','PHOT','+13:00','KI','Kiribati','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(395,'Tokelau Time','Pacific/Fakaofo','Tokelau Time','TKT','+13:00','Tokelau Time','TKT','+13:00','TK','Tokelau','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(396,'Fiji Time','Pacific/Fiji','Fiji Time','FJT','+12:00','Fiji Summer Time','FJST','+13:00','FJ','Fiji','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(397,'Tuvalu Time','Pacific/Funafuti','Tuvalu Time','TVT','+12:00','Tuvalu Time','TVT','+12:00','TV','Tuvalu','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(398,'Galapagos Time','Pacific/Galapagos','Galapagos Time','GALT','-06:00','Galapagos Time','GALT','-06:00','EC','Ecuador','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(399,'Gambier Time','Pacific/Gambier','Gambier Time','GAMT','-09:00','Gambier Time','GAMT','-09:00','PF','French Polynesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(400,'Solomon Islands Time','Pacific/Guadalcanal','Solomon Islands Time','SBT','+11:00','Solomon Islands Time','SBT','+11:00','SB','Solomon Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(401,'Chamorro Standard Time','Pacific/Guam','Chamorro Standard Time','CHST','+10:00','Chamorro Standard Time','CHST','+10:00','GU','Guam','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(402,'Hawaii-Aleutian Time','Pacific/Honolulu','Hawaii-Aleutian Standard Time','HST','-10:00','Hawaii-Aleutian Standard Time','HST','-10:00','US','United States','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(403,'Line Islands Time','Pacific/Kiritimati','Line Islands Time','LINT','+14:00','Line Islands Time','LINT','+14:00','KI','Kiribati','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(404,'Kosrae Time','Pacific/Kosrae','Kosrae Time','KOST','+11:00','Kosrae Time','KOST','+11:00','FM','Micronesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(405,'Marshall Islands Time','Pacific/Kwajalein','Marshall Islands Time','MHT','+12:00','Marshall Islands Time','MHT','+12:00','MH','Marshall Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(406,'Marshall Islands Time','Pacific/Majuro','Marshall Islands Time','MHT','+12:00','Marshall Islands Time','MHT','+12:00','MH','Marshall Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(407,'Marquesas Time','Pacific/Marquesas','Marquesas Time','MART','-09:30','Marquesas Time','MART','-09:30','PF','French Polynesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(408,'Samoa Time','Pacific/Midway','Samoa Standard Time','SST','-11:00','Samoa Standard Time','SST','-11:00','UM','United States Minor Outlying Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(409,'Nauru Time','Pacific/Nauru','Nauru Time','NRT','+12:00','Nauru Time','NRT','+12:00','NR','Nauru','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(410,'Niue Time','Pacific/Niue','Niue Time','NUT','-11:00','Niue Time','NUT','-11:00','NU','Niue','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(411,'Norfolk Time','Pacific/Norfolk','Norfolk Time','NFT','+11:00','Norfolk Time','NFT','+11:00','NF','Norfolk Island','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(412,'New Caledonia Time','Pacific/Noumea','New Caledonia Time','NCT','+11:00','New Caledonia Time','NCT','+11:00','NC','New Caledonia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(413,'Samoa Time','Pacific/Pago_Pago','Samoa Standard Time','SST','-11:00','Samoa Standard Time','SST','-11:00','AS','American Samoa','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(414,'Palau Time','Pacific/Palau','Palau Time','PWT','+09:00','Palau Time','PWT','+09:00','PW','Palau','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(415,'Pacific Standard Time','Pacific/Pitcairn','Pacific Standard Time','PST','-08:00','Pacific Standard Time','PST','-08:00','PN','Pitcairn','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(416,'Pohnpei Time','Pacific/Pohnpei','Pohnpei Standard Time','PONT','+11:00','Pohnpei Standard Time','PONT','+11:00','FM','Micronesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(417,'Papua New Guinea Time','Pacific/Port_Moresby','Papua New Guinea Time','PGT','+10:00','Papua New Guinea Time','PGT','+10:00','PG','Papua New Guinea','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(418,'Cook Island Time','Pacific/Rarotonga','Cook Island Time','CKT','-10:00','Cook Island Time','CKT','-10:00','CK','Cook Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(419,'Chamorro Time','Pacific/Saipan','Chamorro Standard Time','CHST','+10:00','Chamorro Standard Time','CHST','+10:00','MP','Northern Mariana Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(420,'Tahiti Time','Pacific/Tahiti','Tahiti Time','TAHT','-10:00','Tahiti Time','TAHT','-10:00','PF','French Polynesia','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(421,'Gilbert Island Time','Pacific/Tarawa','Gilbert Island Time','GILT','+12:00','Gilbert Island Time','GILT','+12:00','KI','Kiribati','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(422,'Tonga Time','Pacific/Tongatapu','Tonga Time','TOT','+13:00','Tonga Summer Time','TOST','+14:00','TO','Tonga','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(423,'Wake Time','Pacific/Wake','Wake Time','WAKT','+12:00','Wake Time','WAKT','+12:00','UM','United States Minor Outlying Islands','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(424,'Wallis and Futuna Time','Pacific/Wallis','Wallis and Futuna Time','WFT','+12:00','Wallis and Futuna Time','WFT','+12:00','WF','Wallis and Futuna','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00'),(425,'India Time','Asia/Calcutta','India Standard Time','IST','+05:30', 'India Standard Time','IST','+05:30','IN','India','status.timezone.ok','type.generic.placeholder','2017-05-26 00:00:00','2017-05-26 00:00:00');


INSERT INTO public.invite_codes (codeName, sizeInBytes, monetaryValue, createdDT, updatedDT) VALUES ('aatwood','1073741824', '0',NOW(),NOW()), ('appo','1073741824','10.00',NOW(),NOW()), ('archivesrecords','16106127360','150.00',NOW(),NOW()), ('atxh4c','1073741824','10.00',NOW(),NOW()), ('austin100','10737418240','100.00',NOW(),NOW()), ('beta100','10737418240','100.00',NOW(),NOW()), ('dhurlbert','1073741824','0',NOW(),NOW()), ('earlyb1rd','1073741824','10.00',NOW(),NOW()), ('everpresent','16106127360','150.00',NOW(),NOW()), ('famnfrnds','1073741824','10.00',NOW(),NOW()), ('jpeter','1073741824','0',NOW(),NOW()), ('jsmith','1073741824','0',NOW(),NOW()), ('livingtree','1073741824','10.00',NOW(),NOW()), ('mdolan','1073741824','0',NOW(),NOW()), ('nice2meetu','1073741824','10.00',NOW(),NOW()), ('permanent archive','104857600','10',NOW(),NOW()), ('rfriedman','1073741824','0',NOW(),NOW()), ('supporter','1073741824','10.00',NOW(),NOW());

INSERT INTO public.account (primaryEmail, status, notificationPreferences, type) VALUES ('orphanedArchives@permanent.org', 'status.auth.ok', '{"textPreference": {"apps": {"confirmations": 1}, "share": {"requests": 1, "activities": 1, "confirmations": 1}, "account": {"confirmations": 1, "recommendations": 1}, "archive": {"requests": 1, "confirmations": 1}, "relationships": {"requests": 1, "confirmations": 1}}, "emailPreference": {"apps": {"confirmations": 1}, "share": {"requests": 1, "activities": 1, "confirmations": 1}, "account": {"confirmations": 1, "recommendations": 1}, "archive": {"requests": 1, "confirmations": 1}, "relationships": {"requests": 1, "confirmations": 1}}, "inAppPreference": {"apps": {"confirmations": 1}, "share": {"requests": 1, "activities": 1, "confirmations": 1}, "account": {"confirmations": 1, "recommendations": 1}, "archive": {"requests": 1, "confirmations": 1}, "relationships": {"requests": 1, "confirmations": 1}}}', 'type.account.standard');
