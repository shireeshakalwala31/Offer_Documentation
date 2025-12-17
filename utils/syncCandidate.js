const OnboardedCandidate = require("../models/OnboardedCandidate");

// exports.syncCandidateSection = async (draftId, sectionKey, updateData) => {
//   await OnboardedCandidate.findOneAndUpdate(
//     { draftId },
//     { $set: { [sectionKey]: updateData } },
//     { upsert: true, new: true }
//   );
// };

exports.syncCandidateSection = async (draftId, sectionKey, data) => {
  await OnboardedCandidate.findOneAndUpdate(
    { draftId },
    {
      $set: {
        [sectionKey]: data,
        status: "draft",       // reset to draft whenever user updates
        submittedAt: null      // submission is not final yet
      }
    },
    { upsert: true, new: true }
  );
};

