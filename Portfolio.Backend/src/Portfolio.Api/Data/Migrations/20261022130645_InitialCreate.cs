using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portfolio.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "associations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    github_login = table.Column<string>(type: "text", nullable: true),
                    color = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    website_url = table.Column<string>(type: "text", nullable: true),
                    logo_url = table.Column<string>(type: "text", nullable: true),
                    description_es = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_associations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contact_messages",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    language = table.Column<string>(type: "text", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    email_notified = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contact_messages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "data_protection_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    friendly_name = table.Column<string>(type: "text", nullable: true),
                    xml = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_data_protection_keys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "site_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    role_es = table.Column<string>(type: "text", nullable: true),
                    role_en = table.Column<string>(type: "text", nullable: true),
                    bio_es = table.Column<string>(type: "text", nullable: true),
                    bio_en = table.Column<string>(type: "text", nullable: true),
                    dialog_es = table.Column<string>(type: "text", nullable: true),
                    dialog_en = table.Column<string>(type: "text", nullable: true),
                    location_es = table.Column<string>(type: "text", nullable: true),
                    location_en = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    linked_in_url = table.Column<string>(type: "text", nullable: true),
                    whats_app = table.Column<string>(type: "text", nullable: true),
                    github_login = table.Column<string>(type: "text", nullable: true),
                    photo_url = table.Column<string>(type: "text", nullable: true),
                    photo_public_id = table.Column<string>(type: "text", nullable: true),
                    cv_es_url = table.Column<string>(type: "text", nullable: true),
                    cv_es_public_id = table.Column<string>(type: "text", nullable: true),
                    cv_en_url = table.Column<string>(type: "text", nullable: true),
                    cv_en_public_id = table.Column<string>(type: "text", nullable: true),
                    available_for_work = table.Column<bool>(type: "boolean", nullable: false),
                    availability_es = table.Column<string>(type: "text", nullable: true),
                    availability_en = table.Column<string>(type: "text", nullable: true),
                    contributor_tag_color = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    spoken_languages = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_site_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "skills",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    icon = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_skills", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sync_runs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trigger = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    added = table.Column<int>(type: "integer", nullable: false),
                    updated = table.Column<int>(type: "integer", nullable: false),
                    error = table.Column<string>(type: "text", nullable: true),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    finished_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sync_runs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "timeline_entries",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    title_es = table.Column<string>(type: "text", nullable: false),
                    title_en = table.Column<string>(type: "text", nullable: false),
                    organization = table.Column<string>(type: "text", nullable: true),
                    description_es = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    url = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_timeline_entries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    github_id = table.Column<long>(type: "bigint", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    owner_login = table.Column<string>(type: "text", nullable: false),
                    relation = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    html_url = table.Column<string>(type: "text", nullable: true),
                    github_homepage = table.Column<string>(type: "text", nullable: true),
                    github_description = table.Column<string>(type: "text", nullable: true),
                    primary_language = table.Column<string>(type: "text", nullable: true),
                    topics = table.Column<List<string>>(type: "text[]", nullable: false),
                    stars = table.Column<int>(type: "integer", nullable: false),
                    forks = table.Column<int>(type: "integer", nullable: false),
                    is_fork = table.Column<bool>(type: "boolean", nullable: false),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false),
                    github_created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    github_pushed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    removed_from_git_hub = table.Column<bool>(type: "boolean", nullable: false),
                    last_synced_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false),
                    is_featured = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    title_es = table.Column<string>(type: "text", nullable: true),
                    title_en = table.Column<string>(type: "text", nullable: true),
                    description_es = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    demo_url = table.Column<string>(type: "text", nullable: true),
                    technologies = table.Column<List<string>>(type: "text[]", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    image_public_id = table.Column<string>(type: "text", nullable: true),
                    image_locked = table.Column<bool>(type: "boolean", nullable: false),
                    association_id = table.Column<int>(type: "integer", nullable: true),
                    association_locked = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    languages = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_projects", x => x.id);
                    table.ForeignKey(
                        name: "fk_projects_associations_association_id",
                        column: x => x.association_id,
                        principalTable: "associations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_associations_git_hub_login",
                table: "associations",
                column: "github_login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_associations_slug",
                table: "associations",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_contact_messages_created_at",
                table: "contact_messages",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_projects_association_id",
                table: "projects",
                column: "association_id");

            migrationBuilder.CreateIndex(
                name: "ix_projects_full_name",
                table: "projects",
                column: "full_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_projects_git_hub_id",
                table: "projects",
                column: "github_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sync_runs_started_at",
                table: "sync_runs",
                column: "started_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contact_messages");

            migrationBuilder.DropTable(
                name: "data_protection_keys");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropTable(
                name: "site_profiles");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "sync_runs");

            migrationBuilder.DropTable(
                name: "timeline_entries");

            migrationBuilder.DropTable(
                name: "associations");
        }
    }
}
