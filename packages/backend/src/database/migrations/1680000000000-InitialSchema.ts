import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1680000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryRunner.query(`CREATE TABLE organisations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(160) NOT NULL,
      country_code varchar(3) NOT NULL,
      logo_url text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    );`);

    await queryRunner.query(`CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'project_manager', 'member', 'viewer');`);
    await queryRunner.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(160) NOT NULL UNIQUE,
      full_name varchar(120) NOT NULL,
      mobile varchar(32),
      role user_role NOT NULL DEFAULT 'member',
      email_verified boolean NOT NULL DEFAULT false,
      disabled boolean NOT NULL DEFAULT false,
      password varchar(255) NOT NULL,
      refresh_token varchar(255),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    );`);

    await queryRunner.query(`CREATE TABLE teams (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(140) NOT NULL,
      organisation_id uuid NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      CONSTRAINT fk_teams_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE user_organisations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      organisation_id uuid NOT NULL,
      role user_role NOT NULL,
      primary boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_user_organisations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_organisations_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TYPE project_status AS ENUM ('Draft', 'Active', 'On Hold', 'Completed');`);
    await queryRunner.query(`CREATE TABLE projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(180) NOT NULL,
      description text,
      organisation_id uuid NOT NULL,
      status project_status NOT NULL DEFAULT 'Draft',
      start_date timestamptz,
      end_date timestamptz,
      timeline jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      CONSTRAINT fk_projects_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE project_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      project_id uuid NOT NULL,
      team_id uuid,
      role varchar(64),
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_project_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );`);

    await queryRunner.query(`CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(200) NOT NULL,
      project_id uuid NOT NULL,
      organisation_id uuid NOT NULL,
      category varchar(80) NOT NULL,
      confidential boolean NOT NULL DEFAULT false,
      metadata jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      CONSTRAINT fk_documents_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_documents_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE document_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL,
      version varchar(16) NOT NULL,
      filename varchar(180) NOT NULL,
      storage_key varchar(512) NOT NULL,
      mime_type varchar(50) NOT NULL,
      size bigint NOT NULL,
      approved boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_document_versions_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TYPE approval_status AS ENUM ('Pending', 'Approved', 'Rejected');`);
    await queryRunner.query(`CREATE TYPE approval_step_status AS ENUM ('Pending', 'Approved', 'Rejected');`);

    await queryRunner.query(`CREATE TABLE approvals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(220) NOT NULL,
      project_id uuid NOT NULL,
      organisation_id uuid NOT NULL,
      status approval_status NOT NULL DEFAULT 'Pending',
      summary text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      CONSTRAINT fk_approvals_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_approvals_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE approval_steps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      approval_id uuid NOT NULL,
      name varchar(160) NOT NULL,
      approver varchar(160) NOT NULL,
      status approval_step_status NOT NULL DEFAULT 'Pending',
      comments text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_approval_steps_approval FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      approval_id uuid NOT NULL,
      author_id uuid NOT NULL,
      message text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_comments_approval FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE,
      CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );`);

    await queryRunner.query(`CREATE TABLE notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      title varchar(240) NOT NULL,
      message text NOT NULL,
      link varchar(512),
      metadata jsonb,
      read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`);

    await queryRunner.query(`CREATE TABLE audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      organisation_id uuid,
      action varchar(14) NOT NULL,
      entity varchar(240) NOT NULL,
      entity_id uuid,
      metadata text,
      ip_address varchar(45),
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_audit_logs_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL
    );`);

    await queryRunner.query(`CREATE TABLE ai_insights (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id uuid NOT NULL,
      title varchar(120) NOT NULL,
      summary text NOT NULL,
      metrics jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_ai_insights_organisation FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
    );`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS ai_insights;');
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs;');
    await queryRunner.query('DROP TABLE IF EXISTS notifications;');
    await queryRunner.query('DROP TABLE IF EXISTS comments;');
    await queryRunner.query('DROP TABLE IF EXISTS approval_steps;');
    await queryRunner.query('DROP TABLE IF EXISTS approvals;');
    await queryRunner.query('DROP TABLE IF EXISTS document_versions;');
    await queryRunner.query('DROP TABLE IF EXISTS documents;');
    await queryRunner.query('DROP TABLE IF EXISTS project_members;');
    await queryRunner.query('DROP TABLE IF EXISTS projects;');
    await queryRunner.query('DROP TABLE IF EXISTS user_organisations;');
    await queryRunner.query('DROP TABLE IF EXISTS teams;');
    await queryRunner.query('DROP TABLE IF EXISTS users;');
    await queryRunner.query('DROP TABLE IF EXISTS organisations;');
    await queryRunner.query('DROP TYPE IF EXISTS approval_step_status;');
    await queryRunner.query('DROP TYPE IF EXISTS approval_status;');
    await queryRunner.query('DROP TYPE IF EXISTS project_status;');
    await queryRunner.query('DROP TYPE IF EXISTS user_role;');
  }
}
