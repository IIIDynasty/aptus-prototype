/* ============================================
   Azure Function: processCVUpload
   Trigger: Blob Storage Upload
   ============================================ */

const { processCVFile } = require('../../services/CVParser');
const { calculateMatchScore } = require('../../services/ScoringEngine');

module.exports = async function (context, myBlob) {
  context.log(`Processing CV upload: ${context.bindingData.name}`);

  try {
    // Parse blob path: cvs/JOB-2024-1234/CAN-12345678-123.pdf
    const blobPath = context.bindingData.name;
    const pathParts = blobPath.split('/');
    
    if (pathParts.length < 2) {
      context.log.error('Invalid blob path format');
      return;
    }

    const jobId = pathParts[0];
    const fileName = pathParts[1];
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const candidateId = fileName.split('.')[0];

    context.log(`Job: ${jobId}, Candidate: ${candidateId}, Extension: ${fileExtension}`);

    // Get Azure clients
    const { CosmosClient } = require('@azure/cosmos');
    const { BlobServiceClient } = require('@azure/storage-blob');

    const cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.BLOB_STORAGE_CONNECTION_STRING
    );

    const database = cosmosClient.database('aptus-mvp');
    const candidatesContainer = database.container('candidates');
    const jobsContainer = database.container('jobs');

    // Get candidate and job
    const { resource: candidate } = await candidatesContainer.item(candidateId, jobId).read();
    const { resource: job } = await jobsContainer.item(jobId, jobId).read();

    if (!candidate || !job) {
      context.log.error('Candidate or job not found');
      return;
    }

    // Get blob client
    const containerClient = blobServiceClient.getContainerClient('cvs');
    const blobClient = containerClient.getBlobClient(blobPath);

    // Process CV
    const cvData = await processCVFile(blobClient, candidate.skills, fileExtension);

    // Update candidate with CV data
    const updatedCandidate = {
      ...candidate,
      skills: cvData.skills, // Merged skills
      cvEducation: cvData.education,
      cvCertifications: cvData.certifications,
      cvExtractedText: cvData.extractedText
    };

    await candidatesContainer.item(candidateId, jobId).replace(updatedCandidate);

    context.log(`✅ CV data extracted and saved for candidate ${candidateId}`);

    // Re-calculate match score with updated data
    const scores = await calculateMatchScore(updatedCandidate, job);

    updatedCandidate.scores = scores;
    await candidatesContainer.item(candidateId, jobId).replace(updatedCandidate);

    context.log(`✅ Match score recalculated: ${scores.total}/100`);

    // Broadcast to SignalR
    if (context.bindings.signalRMessages) {
      context.bindings.signalRMessages = [{
        target: 'candidateUpdated',
        arguments: [{
          candidateId: candidateId,
          jobId: jobId,
          scores: scores,
          skills: cvData.skills
        }]
      }];
    }

  } catch (error) {
    context.log.error('CV processing failed:', error.message);
    context.log.error(error.stack);
  }
};
