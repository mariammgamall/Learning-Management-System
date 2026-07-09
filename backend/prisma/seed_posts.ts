import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 20 posts for social activity feed...');

  // 1. Fetch Users
  const doc1 = await prisma.user.findFirst({ where: { email: 'ahmedhagag@lms.com' } });
  const doc2 = await prisma.user.findFirst({ where: { email: 'hossamali@lms.com' } });
  const ta1 = await prisma.user.findFirst({ where: { email: 'youssefmohamed@lms.com' } });
  const ta2 = await prisma.user.findFirst({ where: { email: 'omaryasser@lms.com' } });

  const student1 = await prisma.user.findFirst({ where: { email: 'mariamgamal@lms.com' } });
  const student2 = await prisma.user.findFirst({ where: { email: 'shehabebied@lms.com' } });
  const student3 = await prisma.user.findFirst({ where: { email: 'talineyoussef@lms.com' } });
  const student4 = await prisma.user.findFirst({ where: { email: 'moustafaayman@lms.com' } });
  const student5 = await prisma.user.findFirst({ where: { email: 'selimkhaled@lms.com' } });

  if (!doc1 || !doc2 || !ta1 || !ta2) {
    console.error('Core Doctors and TAs not found. Please run the base seed first.');
    return;
  }

  const students = [student1, student2, student3, student4, student5].filter(Boolean) as any[];
  const allUsers = [doc1, doc2, ta1, ta2, ...students];

  // 2. Clear old posts
  console.log('Cleaning old posts...');
  await prisma.post.deleteMany();

  // 3. Define the 20 posts
  const postsData = [
    {
      authorId: doc1.id,
      content: `🚀 The Power of Consistency

Success isn’t about making one huge effort—it’s about showing up every single day. Whether you’re learning a new programming language, preparing for an exam, or building your first project, consistency beats intensity. Spending just one focused hour every day can be far more effective than studying for ten hours the night before a deadline.

💬 Question: What’s one small habit that has helped you stay productive?`,
      comments: [
        { userId: student1?.id, content: 'Turning off notifications and using a physical timer for pomodoro sessions!' },
        { userId: doc1.id, content: 'Excellent advice! Time blocking works wonders.', isReply: true },
        { userId: student2?.id, content: 'Waking up early at 5 AM. No distractions and complete focus.' }
      ]
    },
    {
      authorId: doc1.id,
      content: `🤖 Artificial Intelligence is Changing Everything

Artificial Intelligence is no longer a technology of the future—it’s already part of our daily lives. From personalized recommendations on streaming platforms to medical diagnosis and self-driving vehicles, AI is transforming the way we work and solve problems.

💬 Question: If you could build one AI application to improve people’s lives, what would it be?`,
      comments: [
        { userId: student3?.id, content: 'A smart assistant that translates sign language into text and speech in real-time.' },
        { userId: ta1.id, content: 'An AI-powered tutor that explains complex code architectures based on learning speed.' }
      ]
    },
    {
      authorId: doc1.id,
      content: `📚 Learning Never Stops

Graduation isn’t the finish line—it’s only the beginning. The most successful professionals are lifelong learners. Whether it’s reading books, taking online courses, earning certifications, or building personal projects, continuous learning keeps you ahead in an ever-changing world.

💬 Question: What’s the latest skill you’ve learned?`,
      comments: [
        { userId: student5?.id, content: 'Docker containers and deploying NextJS on VPS servers!' },
        { userId: ta2.id, content: 'Learned Rust programming to write low-level memory safe CLI tools.' }
      ]
    },
    {
      authorId: doc1.id,
      content: `💻 Coding is More Than Writing Code

Programming isn’t just about writing lines of code. It’s about solving real-world problems, thinking logically, and building products that improve people’s lives. Every bug teaches you something new, and every project strengthens your skills.

💬 Question: Which programming language would you recommend to beginners?`,
      comments: [
        { userId: student1?.id, content: 'Python is great for syntax, but Javascript makes you see results in the browser immediately!' },
        { userId: doc2.id, content: 'I highly recommend C++ first to understand computer architecture, memory structures and pointers.' }
      ]
    },
    {
      authorId: doc1.id,
      content: `🌍 Technology Connects the World

Technology has made global collaboration easier than ever. Students, developers, designers, and researchers can now work together from different countries on the same project. Innovation grows when ideas are shared.

💬 Question: Have you ever worked with someone from another country?`,
      comments: [
        { userId: student4?.id, content: 'Yes, on an open-source GitHub project with developers from France and India. Very eye-opening!' }
      ]
    },
    {
      authorId: doc2.id,
      content: `🎯 Small Progress is Still Progress

Don’t underestimate the value of small daily improvements. Progress doesn’t have to be dramatic to be meaningful. Keep learning, stay patient, and remember that every expert started as a beginner.

💬 Question: What’s one achievement you’re proud of this month?`,
      comments: [
        { userId: student2?.id, content: 'Finished building a full responsive clone of an LMS portal dashboard.' },
        { userId: doc2.id, content: 'Amazing work Shehab, keep it up!', isReply: true }
      ]
    },
    {
      authorId: doc2.id,
      content: `📖 Your Favorite Learning Resource

Everyone has that one resource that completely changed how they learn—whether it’s a book, a YouTube channel, a website, or an online course. Sharing great resources helps everyone grow together.

💬 Question: What’s your favorite learning resource?`,
      comments: [
        { userId: student3?.id, content: 'MDN Web Docs and freeCodeCamp. Pure gems!' },
        { userId: ta1.id, content: 'Refactoring.Guru for software design patterns.' }
      ]
    },
    {
      authorId: doc2.id,
      content: `☕ Take a Break—Your Brain Will Thank You

Working without breaks can reduce your focus and creativity. A short walk, stretching, or simply stepping away from your screen for a few minutes can make a huge difference in your productivity.

💬 Question: What’s your favorite way to recharge during study sessions?`,
      comments: [
        { userId: student4?.id, content: 'A short walk outside and a fresh cup of Turkish coffee!' }
      ]
    },
    {
      authorId: doc2.id,
      content: `🚀 Build Projects, Not Just Certificates

Certificates are valuable, but projects show what you can actually do. Building applications, websites, robots, or research projects demonstrates your creativity and practical skills far better than a certificate alone.

💬 Question: What project are you currently working on?`,
      comments: [
        { userId: student1?.id, content: 'Working on a smart scheduling system for university groups using NextJS and NestJS.' }
      ]
    },
    {
      authorId: doc2.id,
      content: `💡 Question of the Week

Imagine you could instantly master one skill today. Would you choose programming, public speaking, graphic design, cybersecurity, artificial intelligence, or something completely different?

Tell us why!`,
      comments: [
        { userId: student5?.id, content: 'Cybersecurity! Protecting systems from attacks is a superpower.' },
        { userId: ta2.id, content: 'Public speaking. Good communication turns code into value.' }
      ]
    },
    {
      authorId: ta1.id,
      content: `⚡ Powering the Future

Energy Resources Engineering focuses on developing efficient and sustainable ways to generate, store, and manage energy. From renewable energy systems like solar and wind to traditional power plants, engineers in this field help shape a cleaner and more reliable future.

💬 Discussion: Which renewable energy source do you believe has the greatest potential over the next decade?`,
      comments: [
        { userId: doc1.id, content: 'Green Hydrogen coupled with Solar systems will dominate.' },
        { userId: student3?.id, content: 'Offshore wind farms are scaling incredibly fast too.' }
      ]
    },
    {
      authorId: ta1.id,
      content: `⚙️ Engineering in Motion

Mechanical Power Engineering combines mechanics, thermodynamics, fluid dynamics, and machine design to create systems that power industries and everyday life. From manufacturing plants to aircraft engines, mechanical engineers are behind countless innovations.

💬 Discussion: If you could design any machine, what would it be?`,
      comments: [
        { userId: student2?.id, content: 'A highly efficient Stirling engine powered solely by industrial waste heat.' }
      ]
    },
    {
      authorId: ta1.id,
      content: `🏭 Making Systems Smarter

Industrial Engineering is all about improving efficiency. Engineers in this field optimize production lines, reduce waste, improve quality, and make organizations work more effectively through data-driven decisions.

💬 Discussion: Which is more important: speed or quality?`,
      comments: [
        { userId: student1?.id, content: 'Quality. Speed is useless if you have to spend double the time fixing failures later.' },
        { userId: ta1.id, content: 'Agreed! Right-first-time yields the highest long-term velocity.', isReply: true }
      ]
    },
    {
      authorId: ta1.id,
      content: `🤖 Where Mechanics Meets Intelligence

Mechatronics combines mechanical engineering, electronics, computer science, and control systems to create smart machines and robots. It’s one of the fastest-growing engineering disciplines today.

💬 Discussion: What real-world problem would you solve using robotics?`,
      comments: [
        { userId: student5?.id, content: 'Automated ocean cleaning drones to safely recover microplastics.' }
      ]
    },
    {
      authorId: ta1.id,
      content: `💻 Building the Digital World

Computer Engineers design the hardware and software systems that power modern technology. Whether developing embedded systems, processors, AI applications, or cloud platforms, they play a key role in digital transformation.

💬 Discussion: Which emerging technology excites you the most?`,
      comments: [
        { userId: student2?.id, content: 'Edge AI processors that perform complex vision models on low power microchips.' }
      ]
    },
    {
      authorId: ta2.id,
      content: `🔌 Innovation Through Electronics

Electronics Engineers design and develop circuits, communication systems, sensors, and embedded devices that make modern technology possible. Smartphones, satellites, and medical equipment all rely on electronics engineering.

💬 Discussion: Which electronic device has had the biggest impact on society?`,
      comments: [
        { userId: doc1.id, content: 'Undoubtedly the transistor. It laid the foundation for all modern processors.' }
      ]
    },
    {
      authorId: ta2.id,
      content: `🏗️ Designing the Cities of Tomorrow

Civil & Architectural Engineering work together to create buildings, bridges, highways, and sustainable urban spaces. Their work combines structural safety, functionality, and aesthetic design to improve how people live.

💬 Discussion: What’s your favorite modern building or architectural landmark?`,
      comments: [
        { userId: student3?.id, content: 'The Burj Khalifa in terms of structural wind mitigation engineering!' }
      ]
    },
    {
      authorId: ta2.id,
      content: `🩺 Engineering That Saves Lives

Biomedical Engineering combines medicine with engineering to develop technologies such as prosthetic limbs, medical imaging devices, wearable health monitors, and advanced diagnostic tools.

💬 Discussion: Which medical innovation has impressed you the most?`,
      comments: [
        { userId: student4?.id, content: 'Brain-Computer Interfaces (BCI) that allow paralyzed patients to control robotic limbs.' }
      ]
    },
    {
      authorId: ta2.id,
      content: `🎨 Design is Communication

Graphic Design is more than creating beautiful visuals—it’s about communicating ideas effectively. Every color, font, and layout influences how people perceive information and brands.

💬 Discussion: Which brand do you think has the best visual identity?`,
      comments: [
        { userId: student1?.id, content: 'Apple. Extremely clean, consistent typography, and instantly recognizable anywhere.' }
      ]
    },
    {
      authorId: ta2.id,
      content: `✨ Creating Better Experiences

UI/UX Designers focus on making digital products intuitive, accessible, and enjoyable. Great design isn’t just about appearance—it’s about understanding users and solving their problems through thoughtful experiences.

💬 Discussion: Which app do you think has the best user experience, and why?`,
      comments: [
        { userId: student2?.id, content: 'Airbnb. The search flow is simple and clean despite handling massive datasets.' }
      ]
    }
  ];

  // 4. Seeding Loop
  console.log('Seeding posts and building comment threads...');
  for (const postData of postsData) {
    const post = await prisma.post.create({
      data: {
        content: postData.content,
        authorId: postData.authorId,
      }
    });

    // Likes seeding
    // Each post gets 3-6 organic likes from random users
    const shuffledUsers = [...allUsers].sort(() => 0.5 - Math.random());
    const likeCount = Math.floor(Math.random() * 4) + 3; // 3 to 6
    const usersToLike = shuffledUsers.slice(0, likeCount);

    await prisma.post.update({
      where: { id: post.id },
      data: {
        likes: {
          connect: usersToLike.map((u) => ({ id: u.id }))
        }
      }
    });

    // Comments seeding
    const parentCommentsMap: { [idx: number]: string } = {};

    for (let cIdx = 0; cIdx < postData.comments.length; cIdx++) {
      const c = postData.comments[cIdx];
      if (!c.userId) continue;

      if (c.isReply) {
        // Reply comment connects to the comment created right before it (cIdx - 1)
        const parentId = parentCommentsMap[cIdx - 1];
        if (parentId) {
          await prisma.comment.create({
            data: {
              content: c.content,
              userId: c.userId,
              postId: post.id,
              parentId: parentId
            }
          });
        }
      } else {
        const comm = await prisma.comment.create({
          data: {
            content: c.content,
            userId: c.userId,
            postId: post.id
          }
        });
        parentCommentsMap[cIdx] = comm.id;
      }
    }
  }

  console.log('Successfully seeded 20 social feed posts, organic likes, and nested comment threads!');
}

main()
  .catch((e) => {
    console.error('Seeding feed posts error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
