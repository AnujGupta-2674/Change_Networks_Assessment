-- CreateEnum
CREATE TYPE "public"."PolicyType" AS ENUM ('MANAGED', 'INLINE');

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Policy" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PolicyType" NOT NULL,
    "statements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserGroupMembership" (
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMembership_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "public"."GroupPolicyAttachment" (
    "groupId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPolicyAttachment_pkey" PRIMARY KEY ("groupId","policyId")
);

-- CreateTable
CREATE TABLE "public"."UserPolicyAttachment" (
    "userId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPolicyAttachment_pkey" PRIMARY KEY ("userId","policyId")
);

-- CreateTable
CREATE TABLE "public"."UserBoundary" (
    "userId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBoundary_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "public"."Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_name_key" ON "public"."Policy"("name");

-- CreateIndex
CREATE INDEX "UserGroupMembership_userId_idx" ON "public"."UserGroupMembership"("userId");

-- CreateIndex
CREATE INDEX "UserGroupMembership_groupId_idx" ON "public"."UserGroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "GroupPolicyAttachment_groupId_idx" ON "public"."GroupPolicyAttachment"("groupId");

-- CreateIndex
CREATE INDEX "GroupPolicyAttachment_policyId_idx" ON "public"."GroupPolicyAttachment"("policyId");

-- CreateIndex
CREATE INDEX "UserPolicyAttachment_userId_idx" ON "public"."UserPolicyAttachment"("userId");

-- CreateIndex
CREATE INDEX "UserPolicyAttachment_policyId_idx" ON "public"."UserPolicyAttachment"("policyId");

-- CreateIndex
CREATE INDEX "UserBoundary_policyId_idx" ON "public"."UserBoundary"("policyId");

-- AddForeignKey
ALTER TABLE "public"."UserGroupMembership" ADD CONSTRAINT "UserGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserGroupMembership" ADD CONSTRAINT "UserGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupPolicyAttachment" ADD CONSTRAINT "GroupPolicyAttachment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupPolicyAttachment" ADD CONSTRAINT "GroupPolicyAttachment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPolicyAttachment" ADD CONSTRAINT "UserPolicyAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPolicyAttachment" ADD CONSTRAINT "UserPolicyAttachment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBoundary" ADD CONSTRAINT "UserBoundary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBoundary" ADD CONSTRAINT "UserBoundary_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
