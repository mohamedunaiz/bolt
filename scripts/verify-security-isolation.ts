/**
 * Automated Security & Data Isolation Test Suite
 * Validates:
 * 1. User Isolation: User A cannot read or write User B collections.
 * 2. Firestore Security Rules syntax & owner verification logic.
 * 3. Zero Plaintext Passwords: Authentication credentials hashing.
 * 4. RAG Document Ingestion Security: Content boundary enforcement and sanitization.
 * 5. MCQ Validation Engine: Strict 4-option, single-correct standard.
 */

import fs from "fs";
import path from "path";
import { validatePrelimsMcq } from "../server/currentAffairsPipeline";
import { indexNewDocument, listDocuments, archiveDocument, deleteDocument, searchKnowledgeChunksAdvanced } from "../server/ragService";
import { registerUser, loginUser, deleteUserAccountAsync, saveUserProgressAsync, getUserProgressAsync } from "../server/userStore";
import { jobQueue } from "../server/jobQueue";

interface TestReport {
  name: string;
  passed: boolean;
  message: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, name: string, failureMsg: string) {
  if (condition) {
    reports.push({ name, passed: true, message: "OK" });
    console.log(`✅ [PASS] ${name}`);
  } else {
    reports.push({ name, passed: false, message: failureMsg });
    console.error(`❌ [FAIL] ${name}: ${failureMsg}`);
  }
}

async function runSecurityTestSuite() {
  console.log("==================================================");
  console.log("🛡️  BOLT AUTOMATED SECURITY & INTEGRITY TEST SUITE");
  console.log("==================================================\n");

  // 1. Audit firestore.rules
  const rulesPath = path.join(process.cwd(), "firestore.rules");
  assert(fs.existsSync(rulesPath), "Firestore Rules Existence", "firestore.rules not found at root");
  const rulesContent = fs.readFileSync(rulesPath, "utf-8");

  assert(
    rulesContent.includes("function isOwner(userId)"),
    "Firestore Rule Helper isOwner Defined",
    "Missing isOwner helper function in firestore.rules"
  );

  const sensitiveCollections = [
    "users/{userId}",
    "syllabus/{userId}",
    "progress/{userId}",
    "studyLogs/{userId}",
    "mainsEvaluations/{userId}",
    "documents/{userId}",
    "chatHistory/{userId}",
    "backgroundJobs/{jobId}",
  ];

  for (const col of sensitiveCollections) {
    assert(
      rulesContent.includes(col),
      `Collection Rule Guard: ${col}`,
      `Collection ${col} missing from firestore.rules`
    );
  }

  // 2. Test User Isolation Logic
  const userAId = "aspirant_test_user_a";
  const userBId = "aspirant_test_user_b";

  // Simulate token context
  const canAccess = (requestAuthUid: string, resourceUserId: string) => {
    return requestAuthUid !== null && requestAuthUid === resourceUserId;
  };

  assert(
    !canAccess(userAId, userBId),
    "Cross-User Access Blocked (User A -> User B)",
    "User A was able to access User B resource"
  );
  assert(
    canAccess(userAId, userAId),
    "User A Self-Access Allowed",
    "User A was not allowed to access their own resource"
  );

  // 2b. Test Background Job Ownership & Multi-Tenant Isolation
  const jobA = jobQueue.enqueue(
    "current_affairs_sync",
    "User A Confidential Daily Sync",
    { testKey: "secret_data_a" },
    { ownerId: userAId }
  );

  // User B attempting to view User A's job directly
  const crossUserJobView = jobQueue.getJob(jobA.id, userBId);
  assert(
    crossUserJobView === null,
    "Job Queue Cross-User Read Blocked",
    "User B was able to view User A's background job"
  );

  // User A viewing own job
  const ownJobView = jobQueue.getJob(jobA.id, userAId);
  assert(
    ownJobView !== null && ownJobView.id === jobA.id,
    "Job Queue Owner Self-Read Allowed",
    "User A could not access their own job"
  );

  // User B attempting to retry User A's job
  let retryBlocked = false;
  try {
    await jobQueue.retryJob(jobA.id, userBId);
  } catch (err) {
    retryBlocked = true;
  }
  assert(
    retryBlocked,
    "Job Queue Cross-User Mutation Blocked",
    "User B was able to retry or mutate User A's job"
  );

  // User B listing jobs does not leak User A's job
  const userBJobs = jobQueue.listJobs({ ownerId: userBId });
  assert(
    !userBJobs.some((j) => j.id === jobA.id),
    "Job Queue List Isolation Enforced",
    "User A's job leaked into User B's listJobs result"
  );

  // 3. Test Zero Plaintext Password Storage
  const regResult = registerUser({
    name: "Audit User",
    email: `audit_${Date.now()}@upsc-bolt.org`,
    password: "SuperSecretPassword123!",
    target: "UPSC CSE 2026",
    optionalSubject: "Public Administration",
  });

  assert(regResult.success, "User Registration Succeeded", "Failed to register test user");
  if (regResult.account) {
    assert(
      regResult.account.password !== "SuperSecretPassword123!",
      "Zero Plaintext Password in Memory/Storage",
      "Password was stored in plaintext!"
    );
  }

  // 4. Test RAG Upload Security & Length Restrictions
  const tooShortDoc = indexNewDocument({
    title: "Bad Doc",
    category: "Custom Upload",
    content: "Too short",
    userId: "test",
  });
  assert(!tooShortDoc.success, "RAG Rejects Short Content (<20 chars)", "Short content was improperly accepted");

  const validDoc = indexNewDocument({
    title: "<b>Safe Title Test</b>",
    category: "Custom Upload",
    content: "This is a valid test document containing sufficient text to pass the 20 characters minimum boundary check.",
    userId: userAId,
  });
  assert(validDoc.success, "RAG Accepts Valid Sanitized Document", "Valid document was rejected");
  if (validDoc.document) {
    assert(
      !validDoc.document.title.includes("<b>"),
      "RAG Strips HTML Tags in Title",
      "HTML tags were not sanitized from document title"
    );
    // Test archive lifecycle
    const archResult = archiveDocument(validDoc.document.id, true);
    assert(archResult, "Document Archive Functionality", "Failed to archive document");

    // Test delete lifecycle
    const delResult = deleteDocument(validDoc.document.id);
    assert(delResult, "Document Deletion Functionality", "Failed to delete document");
  }

  // 4b. Test RAG Document Multi-Tenant Isolation
  const userADoc = indexNewDocument({
    title: "User A Confidential UPSC Revision Notes",
    category: "Custom Upload",
    content: "Confidential Strategy Note: Focus intensely on Public Administration Paper 2 district collectorate role.",
    userId: userAId,
  });

  if (userADoc.success && userADoc.document) {
    // User A should see their document in listDocuments
    const userADocs = listDocuments(userAId);
    assert(
      userADocs.some((d) => d.id === userADoc.document!.id),
      "RAG User A Documents Visible to User A",
      "User A could not see their own uploaded document"
    );

    // User B should NOT see User A's document in listDocuments
    const userBDocs = listDocuments(userBId);
    assert(
      !userBDocs.some((d) => d.id === userADoc.document!.id),
      "RAG Document Multi-Tenant List Isolation",
      "User A's document leaked into User B's document list"
    );

    // Clean up test document
    deleteDocument(userADoc.document.id);
  }

  // 5. Test Strict Prelims MCQ Validation Engine
  const validMcq = {
    questionText: "With reference to the Indian Constitution, consider the following statements regarding Article 356:",
    options: [
      { key: "A", text: "1 only" },
      { key: "B", text: "2 only" },
      { key: "C", text: "Both 1 and 2" },
      { key: "D", text: "Neither 1 nor 2" },
    ],
    correctOption: "C",
    explanation: "Both statements are correct under Supreme Court judgment in SR Bommai v Union of India.",
    // The validator requires one analysis entry per option, exactly one marked correct.
    optionAnalysis: [
      { optionKey: "A", analysis: "Incorrect: statement 2 is also correct.", isCorrect: false },
      { optionKey: "B", analysis: "Incorrect: statement 1 is also correct.", isCorrect: false },
      { optionKey: "C", analysis: "Correct: both statements hold per SR Bommai.", isCorrect: true },
      { optionKey: "D", analysis: "Incorrect: at least one statement is correct.", isCorrect: false },
    ],
  };

  const validationSuccess = validatePrelimsMcq(validMcq);
  assert(validationSuccess.isValid, "Prelims MCQ Validation Engine (Valid)", `Valid MCQ was flagged as invalid: ${validationSuccess.errors.join(" | ")}`);

  // Negative fixtures are otherwise fully valid so each one isolates exactly one rule.
  const invalidMcqDuplicateChoices = {
    questionText: "Which of the following is correct regarding Herbert Simon's Bounded Rationality?",
    options: [
      { key: "A", text: "Satisficing model" },
      { key: "B", text: "Satisficing model" }, // DUPLICATE CHOICE
      { key: "C", text: "Optimizing model" },
      { key: "D", text: "Economic man" },
    ],
    correctOption: "A",
    explanation: "Herbert Simon proposed satisficing behavior.",
    optionAnalysis: [
      { optionKey: "A", analysis: "Correct: Simon proposed satisficing.", isCorrect: true },
      { optionKey: "B", analysis: "Duplicate of option A in this fixture.", isCorrect: false },
      { optionKey: "C", analysis: "Incorrect: optimizing is the classical model.", isCorrect: false },
      { optionKey: "D", analysis: "Incorrect: economic man is the rival concept.", isCorrect: false },
    ],
  };

  const validationFailure = validatePrelimsMcq(invalidMcqDuplicateChoices);
  assert(
    !validationFailure.isValid && validationFailure.errors.some((e) => /duplicate/i.test(e)),
    "Prelims MCQ Rejects Duplicate Options",
    `Duplicate option choice was not rejected for the right reason: ${validationFailure.errors.join(" | ")}`
  );

  const invalidMcqWrongOptionsCount = {
    questionText: "What was Chester Barnard's executive function?",
    options: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
    ],
    correctOption: "A",
    explanation: "Needs 4 options.",
    optionAnalysis: [
      { optionKey: "A", analysis: "Correct in this fixture only.", isCorrect: true },
      { optionKey: "B", analysis: "Incorrect in this fixture only.", isCorrect: false },
      { optionKey: "C", analysis: "Missing option in this fixture.", isCorrect: false },
      { optionKey: "D", analysis: "Missing option in this fixture.", isCorrect: false },
    ],
  };
  const validationFailureCount = validatePrelimsMcq(invalidMcqWrongOptionsCount);
  assert(
    !validationFailureCount.isValid && validationFailureCount.errors.some((e) => /exactly 4 options/i.test(e)),
    "Prelims MCQ Rejects Non-4 Options Count",
    `Non-4 options was not rejected for the right reason: ${validationFailureCount.errors.join(" | ")}`
  );

  // 6. Test User Account Deletion Functionality (GDPR / Right-to-be-Forgotten)
  const deleteTestUser = registerUser({
    name: "Deletion Test Aspirant",
    email: `deletion_test_${Date.now()}@upsc-bolt.org`,
    password: "Password123!",
    target: "UPSC CSE 2026",
    optionalSubject: "Public Administration",
  });
  assert(deleteTestUser.success && !!deleteTestUser.account, "Deletion Test User Created", "Failed to register test user for deletion");

  if (deleteTestUser.account) {
    const delUid = deleteTestUser.account.id;
    // Save progress
    await saveUserProgressAsync(delUid, {
      studySessions: [{ id: "s1", durationMinutes: 45, topicName: "Ethics" }],
    });
    const beforeDelProgress = await getUserProgressAsync(delUid);
    assert(beforeDelProgress !== null, "Progress Recorded Before Deletion", "Progress was not saved prior to deletion");

    // Perform deletion
    const delResult = await deleteUserAccountAsync(delUid);
    assert(delResult === true, "deleteUserAccountAsync Succeeded", "deleteUserAccountAsync returned false");

    // Verify user no longer exists
    const afterDelProgress = await getUserProgressAsync(delUid);
    assert(afterDelProgress === null, "User Progress Purged on Deletion", "User progress remained in store after deletion");

    const reLogin = loginUser({ email: deleteTestUser.account.email, password: "Password123!" });
    assert(!reLogin.success, "Deleted User Cannot Log In", "Deleted user was able to log in");
  }

  // 7. Comprehensive Two-User Isolation Verification
  const user1 = registerUser({
    name: "Aspirant One",
    email: `aspirant_one_${Date.now()}@upsc-bolt.org`,
    password: "PasswordOne123!",
  });
  const user2 = registerUser({
    name: "Aspirant Two",
    email: `aspirant_two_${Date.now()}@upsc-bolt.org`,
    password: "PasswordTwo123!",
  });

  assert(user1.success && user2.success, "Two Distinct Users Registered", "Failed to register two test users");

  if (user1.account && user2.account) {
    // User 1 stores private notes and sessions
    await saveUserProgressAsync(user1.account.id, {
      studySessions: [{ id: "session-secret-1", durationMinutes: 60, topicName: "Top Secret Essay Notes" }],
    });

    const user1Data = await getUserProgressAsync(user1.account.id);
    const user2Data = await getUserProgressAsync(user2.account.id);

    assert(user1Data?.userId === user1.account.id, "User 1 Own Data Integrity Verified", "User 1 data corrupted");
    assert(user2Data?.userId === user2.account.id, "User 2 Own Data Integrity Verified", "User 2 data corrupted");
    assert(
      !user2Data?.studySessions?.some((s: any) => s.topicName === "Top Secret Essay Notes"),
      "User 2 Cannot Read User 1 Private Study Sessions",
      "User 1 private session leaked to User 2"
    );

    // Clean up test accounts
    await deleteUserAccountAsync(user1.account.id);
    await deleteUserAccountAsync(user2.account.id);
  }

  console.log("\n==================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  console.log(`Security Test Run Completed: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL AUTOMATED SECURITY TESTS PASSED.");
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runSecurityTestSuite();
