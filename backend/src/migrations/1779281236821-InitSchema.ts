import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779281236821 implements MigrationInterface {
    name = 'InitSchema1779281236821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`book\` (\`bookid\` int NOT NULL AUTO_INCREMENT, \`bookCode\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`Author\` varchar(255) NOT NULL, \`ISBN\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`borrowedById\` varchar(255) NULL, UNIQUE INDEX \`IDX_67051df9b3934c0deec7793d1c\` (\`bookCode\`), UNIQUE INDEX \`IDX_7459018069b9c93b1d66ec013a\` (\`ISBN\`), PRIMARY KEY (\`bookid\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`borrow_record\` (\`id\` int NOT NULL AUTO_INCREMENT, \`borrowDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dueDate\` datetime NOT NULL, \`returnDate\` timestamp NULL, \`status\` enum ('BORROWED', 'RETURNED') NOT NULL DEFAULT 'BORROWED', \`userId\` int NULL, \`bookBookid\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`customerCode\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'member') NOT NULL DEFAULT 'member', UNIQUE INDEX \`IDX_2806d93e3d50b46d743b22c465\` (\`customerCode\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`borrow_record\` ADD CONSTRAINT \`FK_039a56f88d9fd9c6015c640a5b2\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`borrow_record\` ADD CONSTRAINT \`FK_7dd120cac10154d8ffca2893d1b\` FOREIGN KEY (\`bookBookid\`) REFERENCES \`book\`(\`bookid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`borrow_record\` DROP FOREIGN KEY \`FK_7dd120cac10154d8ffca2893d1b\``);
        await queryRunner.query(`ALTER TABLE \`borrow_record\` DROP FOREIGN KEY \`FK_039a56f88d9fd9c6015c640a5b2\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_2806d93e3d50b46d743b22c465\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`borrow_record\``);
        await queryRunner.query(`DROP INDEX \`IDX_7459018069b9c93b1d66ec013a\` ON \`book\``);
        await queryRunner.query(`DROP INDEX \`IDX_67051df9b3934c0deec7793d1c\` ON \`book\``);
        await queryRunner.query(`DROP TABLE \`book\``);
    }

}
