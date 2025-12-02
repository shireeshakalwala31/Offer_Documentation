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
        [sectionKey]: data
      }
    },
    { upsert: true, new: true }
  );
};
