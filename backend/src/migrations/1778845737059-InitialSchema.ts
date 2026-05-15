import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778845737059 implements MigrationInterface {
    name = 'InitialSchema1778845737059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`book\` CHANGE \`bookCode\` \`bookCode\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`book\` CHANGE \`bookCode\` \`bookCode\` varchar(255) NULL`);
    }

}
