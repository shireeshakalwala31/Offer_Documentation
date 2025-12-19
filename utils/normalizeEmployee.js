// src/utils/normalizeEmployee.js

export const normalizeEmployee = (emp = {}) => ({
  draftId: emp.draftId,

  personal: emp.personal || {},

  pf: emp.pfDetails || {},

  academic: emp.academicDetails || [],

  experience: emp.experienceDetails || [],

  family: emp.familyDetails || [],

  declaration: emp.declarationDetails || {},

  office: emp.officeUseDetails || {},
});
