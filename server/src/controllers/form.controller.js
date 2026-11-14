const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Website = require('../models/Website');
const FormSubmission = require('../models/FormSubmission');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

// formId flows into Mongo filters and storage — restrict to a safe token shape
// so query/operator values can never pass through.
const SAFE_FORM_ID = /^[a-zA-Z0-9_-]{1,64}$/;

// Public: submit a form (no auth). Website must exist.
const submitForm = asyncHandler(async (req, res) => {
  const websiteId = req.params.websiteId;
  const website = await Website.findById(websiteId).select('_id status');
  if (!website) throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  const { formId, pageId, data } = req.body;
  const submission = await FormSubmission.create({
    websiteId: website._id,
    pageId: pageId || null,
    formId: SAFE_FORM_ID.test(String(formId || '')) ? formId : 'contact',
    data: data || {},
    ip: req.ip,
    userAgent: req.headers['user-agent'] || '',
  });
  // Don't hand the submitter back their spoofable IP / user-agent.
  const safe = submission.toObject();
  delete safe.ip;
  delete safe.userAgent;
  return sendSuccess(res, { submission: safe }, 'Form submitted', 201);
});

const listSubmissions = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const filter = { websiteId };
  if (req.query.formId && SAFE_FORM_ID.test(String(req.query.formId))) {
    filter.formId = req.query.formId;
  }
  const [total, submissions] = await Promise.all([
    FormSubmission.countDocuments(filter),
    FormSubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return sendSuccess(res, { submissions, total, page, limit, pages: Math.ceil(total / limit) }, 'Submissions fetched');
});

const deleteSubmission = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const submission = await FormSubmission.findOne({ _id: req.params.submissionId, websiteId });
  if (!submission) throw new ApiError(404, 'Submission not found', 'SUBMISSION_NOT_FOUND');
  await submission.deleteOne();
  return sendSuccess(res, { deleted: true }, 'Submission deleted');
});

module.exports = { submitForm, listSubmissions, deleteSubmission };
