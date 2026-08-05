-- One-time local setup: creates a dedicated role + database for this
-- project on an existing PostgreSQL instance. Run once as a superuser,
-- e.g.: psql -U postgres -f server/prisma/local-db-setup.sql
CREATE ROLE hostel_admin WITH LOGIN PASSWORD 'hostel_admin' CREATEDB;
CREATE DATABASE hostel_complaints OWNER hostel_admin;
GRANT ALL PRIVILEGES ON DATABASE hostel_complaints TO hostel_admin;
