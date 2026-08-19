ALTER TABLE "SharedLink" DROP CONSTRAINT "SharedLink_attachmentId_fkey";
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
