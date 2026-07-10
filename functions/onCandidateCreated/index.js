/* ============================================
   Azure Function: onCandidateCreated
   Trigger: Cosmos DB Change Feed
   ============================================ */

const { calculateMatchScore } = require('../../services/ScoringEngine');

module.exports = async function (context, documents) {
  if (!documents || documents.length === 0) {
    return;
  }

  context.log(`Processing ${documents.length} candidate document(s)`);

  for (const candidate of documents) {
    try {
      // Skip if already scored
      if (candidate.scores && candidate.scores.total !== null) {
        context.log(`Candidate ${candidate.id} already scored, skipping`);
        continue;
      }

      // Get job data
      const { CosmosClient } = require('@azure/cosmos');
      const client = new CosmosClient({
        endpoint: process.env.COSMOS_DB_ENDPOINT,
        key: process.env.COSMOS_DB_KEY
      });
      
      const database = client.database('aptus-mvp');
      const jobsContainer = database.container('jobs');
      const candidatesContainer = database.container('candidates');

      const { resource: job } = await jobsContainer.item(candidate.jobId, candidate.jobId).read();

      if (!job) {
        context.log.error(`Job ${candidate.jobId} not found`);
        continue;
      }

      // Calculate match score
      const scores = await calculateMatchScore(candidate, job);

      // Update candidate with scores
      const updatedCandidate = {
        ...candidate,
        scores: scores
      };

      await candidatesContainer.item(candidate.id, candidate.jobId).replace(updatedCandidate);

      context.log(`✅ Candidate ${candidate.id} scored: ${scores.total}/100`);

      // Broadcast to SignalR (if configured)
      if (context.bindings.signalRMessages) {
        context.bindings.signalRMessages = [{
          target: 'candidateScored',
          arguments: [{
            candidateId: candidate.id,
            jobId: candidate.jobId,
            scores: scores
          }]
        }];
      }

    } catch (error) {
      context.log.error(`Failed to score candidate ${candidate.id}:`, error.message);
      
      // Assign default score on failure
      try {
        const { CosmosClient } = require('@azure/cosmos');
        const client = new CosmosClient({
          endpoint: process.env.COSMOS_DB_ENDPOINT,
          key: process.env.COSMOS_DB_KEY
        });
        
        const database = client.database('aptus-mvp');
        const candidatesContainer = database.container('candidates');

        const updatedCandidate = {
          ...candidate,
          scores: {
            skills: 50,
            experience: 50,
            qualifications: 50,
            quality: 50,
            total: 50
          }
        };

        await candidatesContainer.item(candidate.id, candidate.jobId).replace(updatedCandidate);
        context.log(`⚠️ Assigned default score to candidate ${candidate.id}`);
      } catch (updateError) {
        context.log.error(`Failed to assign default score:`, updateError.message);
      }
    }
  }
};
