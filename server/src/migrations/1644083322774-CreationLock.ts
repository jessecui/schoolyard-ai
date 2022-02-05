import {MigrationInterface, QueryRunner} from "typeorm";

export class CreationLock1644083322774 implements MigrationInterface {
    name = 'CreationLock1644083322774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "canCreate" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "canCreate"`);
    }

}
