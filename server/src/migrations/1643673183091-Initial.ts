import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1643673183091 implements MigrationInterface {
    name = 'Initial1643673183091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "parent_child" ("parentId" integer NOT NULL, "childId" integer NOT NULL, "orderNumber" integer NOT NULL, CONSTRAINT "PK_a8a662b2f990d2fbccfc465b5d1" PRIMARY KEY ("parentId", "orderNumber"))`);
        await queryRunner.query(`CREATE TYPE "public"."question_review_reviewstatus_enum" AS ENUM('queued', 'incorrect', 'correct')`);
        await queryRunner.query(`CREATE TABLE "question_review" ("userId" integer NOT NULL, "questionId" integer NOT NULL, "reviewStatus" "public"."question_review_reviewstatus_enum" NOT NULL, "correctStreak" integer NOT NULL, "dateNextAvailable" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2a0035a6c81707f6376df7607d2" PRIMARY KEY ("userId", "questionId"))`);
        await queryRunner.query(`CREATE TABLE "question_view" ("userId" integer NOT NULL, "questionId" integer NOT NULL, "userViewCount" integer NOT NULL, CONSTRAINT "PK_a4d3a0d279c2b0c0b04133f396c" PRIMARY KEY ("userId", "questionId"))`);
        await queryRunner.query(`CREATE TABLE "question_subject" ("questionId" integer NOT NULL, "subjectName" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_eb0956cdd6e60b38a302c405c68" PRIMARY KEY ("questionId", "subjectName"))`);
        await queryRunner.query(`CREATE TABLE "sentence_subject" ("sentenceId" integer NOT NULL, "subjectName" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_53bfaf3db0008d2695fd0f00d3f" PRIMARY KEY ("sentenceId", "subjectName"))`);
        await queryRunner.query(`CREATE TABLE "subject" ("subjectName" character varying NOT NULL, CONSTRAINT "PK_0481fde67dc08515c21fbd307e2" PRIMARY KEY ("subjectName"))`);
        await queryRunner.query(`CREATE TABLE "score" ("subjectName" character varying NOT NULL, "userId" integer NOT NULL, "queued" integer NOT NULL, "correct" integer NOT NULL, "incorrect" integer NOT NULL, CONSTRAINT "PK_c8e5bd200bf2070ccb8a97d8e59" PRIMARY KEY ("subjectName", "userId"))`);
        await queryRunner.query(`CREATE TABLE "sentence_view" ("userId" integer NOT NULL, "sentenceId" integer NOT NULL, "userViewCount" integer NOT NULL, "lastViewed" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_37163e6c7c6f96ac507ba4a2011" PRIMARY KEY ("userId", "sentenceId"))`);
        await queryRunner.query(`CREATE TYPE "public"."sentence_vote_votetype_enum" AS ENUM('1', '-1')`);
        await queryRunner.query(`CREATE TABLE "sentence_vote" ("userId" integer NOT NULL, "sentenceId" integer NOT NULL, "voteType" "public"."sentence_vote_votetype_enum" NOT NULL, CONSTRAINT "PK_9cdb6897fc41b52fcbb4020c441" PRIMARY KEY ("userId", "sentenceId"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "password" character varying NOT NULL, "photoUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."question_vote_votetype_enum" AS ENUM('1', '-1')`);
        await queryRunner.query(`CREATE TABLE "question_vote" ("userId" integer NOT NULL, "questionId" integer NOT NULL, "voteType" "public"."question_vote_votetype_enum" NOT NULL, CONSTRAINT "PK_eacae7cc19274b9413798986097" PRIMARY KEY ("userId", "questionId"))`);
        await queryRunner.query(`CREATE TYPE "public"."question_questiontype_enum" AS ENUM('text', 'single', 'multiple')`);
        await queryRunner.query(`CREATE TABLE "question" ("id" SERIAL NOT NULL, "creatorId" integer NOT NULL, "text" character varying NOT NULL, "questionType" "public"."question_questiontype_enum" NOT NULL, "sentenceId" integer, "choices" character varying array, "answer" character varying array NOT NULL, "upVoteCount" integer NOT NULL DEFAULT '0', "downVoteCount" integer NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sentence" ("id" SERIAL NOT NULL, "text" character varying NOT NULL, "creatorId" integer NOT NULL, "upVoteCount" integer NOT NULL DEFAULT '0', "downVoteCount" integer NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "embedding" double precision array NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eed8b400064f053f70c004b83e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cloning_clonetype_enum" AS ENUM('creation', 'auto', 'manual')`);
        await queryRunner.query(`CREATE TABLE "cloning" ("olderCloneId" integer NOT NULL, "youngerCloneId" integer NOT NULL, "distance" double precision NOT NULL, "cloneType" "public"."cloning_clonetype_enum" NOT NULL, CONSTRAINT "PK_04b01d8c605f1c8f45582d1ddad" PRIMARY KEY ("olderCloneId", "youngerCloneId"))`);
        await queryRunner.query(`ALTER TABLE "parent_child" ADD CONSTRAINT "FK_f150d62ed440a7615bec405dc65" FOREIGN KEY ("parentId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_review" ADD CONSTRAINT "FK_7633aa5d283d41854c1baab49b8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_review" ADD CONSTRAINT "FK_d9d5fc170f69e73cc62b42ed082" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_view" ADD CONSTRAINT "FK_b2aa40ad8fda4a0e965c554e454" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_view" ADD CONSTRAINT "FK_cbbf373ee33e65aeaa791738dcb" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_subject" ADD CONSTRAINT "FK_45bd27ed5e06b4a5c3c4e986839" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_subject" ADD CONSTRAINT "FK_35e2c68c1782e00a483fd9f2517" FOREIGN KEY ("subjectName") REFERENCES "subject"("subjectName") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_subject" ADD CONSTRAINT "FK_60d2c279c40a247c7f70860a12a" FOREIGN KEY ("sentenceId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_subject" ADD CONSTRAINT "FK_aa7334fc6dd6826de042b693ee0" FOREIGN KEY ("subjectName") REFERENCES "subject"("subjectName") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score" ADD CONSTRAINT "FK_e69070e4ceec85c0e395179f0e0" FOREIGN KEY ("subjectName") REFERENCES "subject"("subjectName") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score" ADD CONSTRAINT "FK_327e5a5890df4462edf4ac9fa30" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_view" ADD CONSTRAINT "FK_c9fc7774a8553a1b2151e2301ff" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_view" ADD CONSTRAINT "FK_eaa620504d31bea784d96911b1d" FOREIGN KEY ("sentenceId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_vote" ADD CONSTRAINT "FK_70d70f198cfa99aa769d1727c18" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence_vote" ADD CONSTRAINT "FK_39169ac4b81ce2b065e8183026e" FOREIGN KEY ("sentenceId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_vote" ADD CONSTRAINT "FK_24a3c5c74bb46367355bb6dfab4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_vote" ADD CONSTRAINT "FK_813910b42f15e65b1aac715afd4" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_ef0a5560abaa33606a4b87ab33e" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_6448f05e385a3126ec6e1289b19" FOREIGN KEY ("sentenceId") REFERENCES "sentence"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sentence" ADD CONSTRAINT "FK_58bec9a286bf276e5011a8a7973" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cloning" ADD CONSTRAINT "FK_9a2e898342ed1d1d0cdc23e6ee0" FOREIGN KEY ("olderCloneId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cloning" ADD CONSTRAINT "FK_f5ab1b4a449b0c006ebd4cc3553" FOREIGN KEY ("youngerCloneId") REFERENCES "sentence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cloning" DROP CONSTRAINT "FK_f5ab1b4a449b0c006ebd4cc3553"`);
        await queryRunner.query(`ALTER TABLE "cloning" DROP CONSTRAINT "FK_9a2e898342ed1d1d0cdc23e6ee0"`);
        await queryRunner.query(`ALTER TABLE "sentence" DROP CONSTRAINT "FK_58bec9a286bf276e5011a8a7973"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_6448f05e385a3126ec6e1289b19"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_ef0a5560abaa33606a4b87ab33e"`);
        await queryRunner.query(`ALTER TABLE "question_vote" DROP CONSTRAINT "FK_813910b42f15e65b1aac715afd4"`);
        await queryRunner.query(`ALTER TABLE "question_vote" DROP CONSTRAINT "FK_24a3c5c74bb46367355bb6dfab4"`);
        await queryRunner.query(`ALTER TABLE "sentence_vote" DROP CONSTRAINT "FK_39169ac4b81ce2b065e8183026e"`);
        await queryRunner.query(`ALTER TABLE "sentence_vote" DROP CONSTRAINT "FK_70d70f198cfa99aa769d1727c18"`);
        await queryRunner.query(`ALTER TABLE "sentence_view" DROP CONSTRAINT "FK_eaa620504d31bea784d96911b1d"`);
        await queryRunner.query(`ALTER TABLE "sentence_view" DROP CONSTRAINT "FK_c9fc7774a8553a1b2151e2301ff"`);
        await queryRunner.query(`ALTER TABLE "score" DROP CONSTRAINT "FK_327e5a5890df4462edf4ac9fa30"`);
        await queryRunner.query(`ALTER TABLE "score" DROP CONSTRAINT "FK_e69070e4ceec85c0e395179f0e0"`);
        await queryRunner.query(`ALTER TABLE "sentence_subject" DROP CONSTRAINT "FK_aa7334fc6dd6826de042b693ee0"`);
        await queryRunner.query(`ALTER TABLE "sentence_subject" DROP CONSTRAINT "FK_60d2c279c40a247c7f70860a12a"`);
        await queryRunner.query(`ALTER TABLE "question_subject" DROP CONSTRAINT "FK_35e2c68c1782e00a483fd9f2517"`);
        await queryRunner.query(`ALTER TABLE "question_subject" DROP CONSTRAINT "FK_45bd27ed5e06b4a5c3c4e986839"`);
        await queryRunner.query(`ALTER TABLE "question_view" DROP CONSTRAINT "FK_cbbf373ee33e65aeaa791738dcb"`);
        await queryRunner.query(`ALTER TABLE "question_view" DROP CONSTRAINT "FK_b2aa40ad8fda4a0e965c554e454"`);
        await queryRunner.query(`ALTER TABLE "question_review" DROP CONSTRAINT "FK_d9d5fc170f69e73cc62b42ed082"`);
        await queryRunner.query(`ALTER TABLE "question_review" DROP CONSTRAINT "FK_7633aa5d283d41854c1baab49b8"`);
        await queryRunner.query(`ALTER TABLE "parent_child" DROP CONSTRAINT "FK_f150d62ed440a7615bec405dc65"`);
        await queryRunner.query(`DROP TABLE "cloning"`);
        await queryRunner.query(`DROP TYPE "public"."cloning_clonetype_enum"`);
        await queryRunner.query(`DROP TABLE "sentence"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TYPE "public"."question_questiontype_enum"`);
        await queryRunner.query(`DROP TABLE "question_vote"`);
        await queryRunner.query(`DROP TYPE "public"."question_vote_votetype_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "sentence_vote"`);
        await queryRunner.query(`DROP TYPE "public"."sentence_vote_votetype_enum"`);
        await queryRunner.query(`DROP TABLE "sentence_view"`);
        await queryRunner.query(`DROP TABLE "score"`);
        await queryRunner.query(`DROP TABLE "subject"`);
        await queryRunner.query(`DROP TABLE "sentence_subject"`);
        await queryRunner.query(`DROP TABLE "question_subject"`);
        await queryRunner.query(`DROP TABLE "question_view"`);
        await queryRunner.query(`DROP TABLE "question_review"`);
        await queryRunner.query(`DROP TYPE "public"."question_review_reviewstatus_enum"`);
        await queryRunner.query(`DROP TABLE "parent_child"`);
    }

}
