import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define custom TS constants matching the SQLite roles
const Role = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  TA: 'TA',
  STUDENT: 'STUDENT',
};

const FileType = {
  VIDEO: 'VIDEO',
  PDF: 'PDF',
  SLIDES: 'SLIDES',
  OTHER: 'OTHER',
};

const QuestionType = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
};

const ResultVisibility = {
  IMMEDIATE: 'IMMEDIATE',
  AFTER_DEADLINE: 'AFTER_DEADLINE',
};

async function main() {
  console.log('Seeding SQLite database...');

  // Clean tables to prevent seeding duplicates
  console.log('Cleaning database tables...');
  await prisma.attendance.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.watchedLecture.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.meetingMessage.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseTA.deleteMany();
  await prisma.notification.deleteMany();

  // Declare variables to store Course 4 lecture references for watched mapping
  let lecture4_1: any;
  let lecture4_2: any;

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash('Password@123', saltRounds);

  // 1. Create Users
  console.log('Creating users...');

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@lms.com',
      name: 'System Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Doctors
  const doctor1 = await prisma.user.upsert({
    where: { email: 'ahmedhagag@lms.com' },
    update: { password: passwordHash },
    create: {
      email: 'ahmedhagag@lms.com',
      name: 'Dr. Ahmed Hagag',
      password: passwordHash,
      role: Role.DOCTOR,
      isActive: true,
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: 'hossamali@lms.com' },
    update: { password: passwordHash },
    create: {
      email: 'hossamali@lms.com',
      name: 'Dr. Hossam Ali',
      password: passwordHash,
      role: Role.DOCTOR,
      isActive: true,
    },
  });

  // TAs
  const ta1 = await prisma.user.upsert({
    where: { email: 'youssefmohamed@lms.com' },
    update: { password: passwordHash },
    create: {
      email: 'youssefmohamed@lms.com',
      name: 'Youssef Mohamed',
      password: passwordHash,
      role: Role.TA,
      isActive: true,
    },
  });

  const ta2 = await prisma.user.upsert({
    where: { email: 'omaryasser@lms.com' },
    update: { password: passwordHash },
    create: {
      email: 'omaryasser@lms.com',
      name: 'Omar Yasser',
      password: passwordHash,
      role: Role.TA,
      isActive: true,
    },
  });

  // Students
  const students = [];
  const studentNames = [
    'Mariam Gamal Elsayed Khamiss Yassin',
    'Shehab Ebied',
    'Taline Youssef',
    'Moustafa Ayman',
    'Selim Khaled'
  ];
  const studentEmails = [
    'mariamgamal@lms.com',
    'shehabebied@lms.com',
    'talineyoussef@lms.com',
    'moustafaayman@lms.com',
    'selimkhaled@lms.com'
  ];

  for (let i = 0; i < 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: studentEmails[i] },
      update: { password: passwordHash, name: studentNames[i] },
      create: {
        email: studentEmails[i],
        name: studentNames[i],
        password: passwordHash,
        role: Role.STUDENT,
        isActive: true,
      },
    });
    students.push(student);
  }

  // 2. Create Courses
  console.log('Creating courses...');

  // Course 1: Intro to Computer Science
  const course1 = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: '<p>Learn the fundamental concepts of computing, programming, and algorithms.</p>',
      doctorId: doctor1.id,
      isPublished: true,
    },
  });

  // Course 2: Advanced Web Development
  const course2 = await prisma.course.upsert({
    where: { code: 'CS301' },
    update: {},
    create: {
      code: 'CS301',
      title: 'Advanced Web Development',
      description: '<p>Master modern web architectures using TypeScript, Express, Next.js, and advanced styling.</p>',
      doctorId: doctor2.id,
      isPublished: true,
    },
  });

  // Course 3: Introduction to Artificial Intelligence
  const course3 = await prisma.course.upsert({
    where: { code: 'CS401' },
    update: {},
    create: {
      code: 'CS401',
      title: 'Introduction to Artificial Intelligence',
      description: '<p>Dive deep into machine learning, neural networks, and heuristics.</p>',
      doctorId: doctor1.id,
      isPublished: true,
    },
  });

  // Course 4: Cyber Security and Ethical Hacking (Paid)
  const course4 = await prisma.course.upsert({
    where: { code: 'CS310' },
    update: { isPaid: true, price: 6000.0 },
    create: {
      code: 'CS310',
      title: 'Cyber Security and Ethical Hacking',
      description: '<p>Learn security architecture, vulnerability assessment, pen-testing techniques, and network defense strategies.</p>',
      doctorId: doctor1.id,
      isPublished: true,
      isPaid: true,
      price: 6000.0,
    },
  });

  // Course 5: Mobile App Engineering (Paid)
  const course5 = await prisma.course.upsert({
    where: { code: 'CS320' },
    update: { isPaid: true, price: 8000.0 },
    create: {
      code: 'CS320',
      title: 'Mobile App Engineering with React Native',
      description: '<p>Master cross-platform mobile app development with React Native, hooks, routing, state management, and device integration.</p>',
      doctorId: doctor2.id,
      isPublished: true,
      isPaid: true,
      price: 8000.0,
    },
  });

  // Course 6: UI/UX Design (Paid, 7000 LE)
  const course6 = await prisma.course.upsert({
    where: { code: 'CS280' },
    update: { isPaid: true, price: 7000.0 },
    create: {
      code: 'CS280',
      title: 'UI/UX Design',
      description: '<p>Master visual design, usability, typography, color theory, and prototyping inside Figma.</p>',
      doctorId: doctor1.id,
      isPublished: true,
      isPaid: true,
      price: 7000.0,
    },
  });

  // Assign TAs to courses
  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course1.id, userId: ta1.id } },
    update: {},
    create: { courseId: course1.id, userId: ta1.id },
  });

  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course2.id, userId: ta2.id } },
    update: {},
    create: { courseId: course2.id, userId: ta2.id },
  });

  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course3.id, userId: ta2.id } },
    update: {},
    create: { courseId: course3.id, userId: ta2.id },
  });

  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course4.id, userId: ta1.id } },
    update: {},
    create: { courseId: course4.id, userId: ta1.id },
  });

  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course5.id, userId: ta2.id } },
    update: {},
    create: { courseId: course5.id, userId: ta2.id },
  });

  await prisma.courseTA.upsert({
    where: { courseId_userId: { courseId: course6.id, userId: ta1.id } },
    update: {},
    create: { courseId: course6.id, userId: ta1.id },
  });

  // Enroll Students
  console.log('Enrolling students...');
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
      update: {},
      create: { studentId: student.id, courseId: course1.id },
    });
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
      update: {},
      create: { studentId: student.id, courseId: course2.id },
    });
  }

  // Enroll Shehab (students[1]) in UI/UX Design course
  const shehabUser = students.find(s => s.email === 'shehabebied@lms.com');
  if (shehabUser) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: shehabUser.id, courseId: course6.id } },
      update: {},
      create: { studentId: shehabUser.id, courseId: course6.id },
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: students[i].id, courseId: course3.id } },
      update: {},
      create: { studentId: students[i].id, courseId: course3.id },
    });
  }

  // 3. Create Lectures
  console.log('Creating lectures...');

  // Course 1 (CS101)
  await prisma.lecture.create({
    data: {
      title: 'Introduction to Computers and Binary Logic',
      courseId: course1.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  await prisma.lecture.create({
    data: {
      title: 'Understanding Variables and Basic Control Flow',
      courseId: course1.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: false,
    }
  });

  // Course 2 (CS301)
  await prisma.lecture.create({
    data: {
      title: 'Setting Up Express with TypeScript Core',
      courseId: course2.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  await prisma.lecture.create({
    data: {
      title: 'Next.js App Router and Server Components',
      courseId: course2.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: true,
    }
  });

  // Course 3 (CS401)
  await prisma.lecture.create({
    data: {
      title: 'History of AI and Heuristic Search Algorithms',
      courseId: course3.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  await prisma.lecture.create({
    data: {
      title: 'Neural Networks and Supervised Learning Models',
      courseId: course3.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: true,
    }
  });

  // Course 4 (CS310)
  lecture4_1 = await prisma.lecture.create({
    data: {
      title: 'Introduction to Network Defense and Pentesting',
      courseId: course4.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  lecture4_2 = await prisma.lecture.create({
    data: {
      title: 'Vulnerability Assessment and Port Scanning',
      courseId: course4.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: true,
    }
  });

  // Course 5 (CS320)
  await prisma.lecture.create({
    data: {
      title: 'React Native Basics and Layout Components',
      courseId: course5.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  await prisma.lecture.create({
    data: {
      title: 'State Management and Device Integration',
      courseId: course5.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: true,
    }
  });

  // Course 6 (CS280)
  const lectureUi1 = await prisma.lecture.create({
    data: {
      title: 'UI/UX Foundations: Color Theory and Typography',
      courseId: course6.id,
      weekNumber: 1,
      fileUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      fileType: FileType.VIDEO,
      allowDownload: true,
    }
  });
  const lectureUi2 = await prisma.lecture.create({
    data: {
      title: 'Interactive Prototyping and Wireframing in Figma',
      courseId: course6.id,
      weekNumber: 2,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: FileType.PDF,
      allowDownload: true,
    }
  });

  // Mark both lectures as watched by Shehab for 100% completion
  if (shehabUser) {
    await prisma.watchedLecture.create({
      data: {
        studentId: shehabUser.id,
        lectureId: lectureUi1.id,
      }
    });
    await prisma.watchedLecture.create({
      data: {
        studentId: shehabUser.id,
        lectureId: lectureUi2.id,
      }
    });
  }

  // 4. Create Assignments
  console.log('Creating assignments...');

  const assign1 = await prisma.assignment.create({
    data: {
      title: 'Programming Assignment 1: Sorting Algorithms',
      description: '<h3>Goal</h3><p>Implement Bubble Sort, Quick Sort, and Merge Sort in Python. Document their runtime performance.</p><h3>Deliverables</h3><p>Upload a ZIP file containing your source code and a PDF report.</p>',
      courseId: course1.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      maxScore: 100,
    }
  });

  await prisma.assignment.create({
    data: {
      title: 'Project Milestone 1: REST API Development',
      description: '<h3>Goal</h3><p>Build a secure REST API with express, JWT authorization, and Prisma schemas. Integrate Zod validation.</p><h3>Submission</h3><p>Include your github repository link and a Postman collection exported JSON.</p>',
      courseId: course2.id,
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (LATE test case)
      maxScore: 100,
    }
  });

  // 5. Create Quizzes
  console.log('Creating quizzes...');

  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'CS101 Midterm Prep Quiz',
      courseId: course1.id,
      timeLimit: 15,
      maxAttempts: 2,
      shuffleQuestions: false,
      showResultsAfter: ResultVisibility.IMMEDIATE,
    }
  });

  // Add questions to quiz 1 (options serialized to JSON string)
  await prisma.question.create({
    data: {
      quizId: quiz1.id,
      text: 'What is the time complexity of searching in a balanced Binary Search Tree?',
      type: QuestionType.MCQ,
      options: JSON.stringify(['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']),
      correctAnswer: 'O(log n)',
    }
  });

  await prisma.question.create({
    data: {
      quizId: quiz1.id,
      text: 'Quick Sort is a divide-and-conquer algorithm.',
      type: QuestionType.TRUE_FALSE,
      options: JSON.stringify(['True', 'False']),
      correctAnswer: 'True',
    }
  });

  await prisma.question.create({
    data: {
      quizId: quiz1.id,
      text: 'Briefly explain the difference between a Compiler and an Interpreter.',
      type: QuestionType.SHORT_ANSWER,
      options: JSON.stringify([]),
      correctAnswer: 'A compiler translates the entire program into machine code at once before execution, whereas an interpreter translates and executes the code line-by-line during runtime.',
    }
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'CS301 Weekly Quiz 1: HTTP & REST Protocols',
      courseId: course2.id,
      timeLimit: 5,
      maxAttempts: 1,
      shuffleQuestions: true,
      showResultsAfter: ResultVisibility.AFTER_DEADLINE,
    }
  });

  await prisma.question.create({
    data: {
      quizId: quiz2.id,
      text: 'Which HTTP method should be idempotent?',
      type: QuestionType.MCQ,
      options: JSON.stringify(['POST', 'GET', 'PUT', 'DELETE']),
      correctAnswer: 'GET',
    }
  });

  await prisma.question.create({
    data: {
      quizId: quiz2.id,
      text: 'Cookies configured with httpOnly can be accessed via client-side JavaScript.',
      type: QuestionType.TRUE_FALSE,
      options: JSON.stringify(['True', 'False']),
      correctAnswer: 'False',
    }
  });

  // Duplicate course lectures blocks removed to avoid duplicate progress counts

  // Enroll student Mariam Gamal in Course 4
  const mariamGamal = students[0];
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: mariamGamal.id, courseId: course4.id } },
    update: {},
    create: { studentId: mariamGamal.id, courseId: course4.id },
  });

  // Mark all lectures of Course 4 as watched by Mariam Gamal
  await prisma.watchedLecture.create({
    data: {
      studentId: mariamGamal.id,
      lectureId: lecture4_1.id,
    }
  });

  await prisma.watchedLecture.create({
    data: {
      studentId: mariamGamal.id,
      lectureId: lecture4_2.id,
    }
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
