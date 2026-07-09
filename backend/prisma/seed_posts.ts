import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding posts data...');
  
  // Find Dr. Ahmed Hagag & Dr. Hossam Ali
  const doctor1 = await prisma.user.findFirst({
    where: { email: 'ahmedhagag@lms.com' }
  });
  
  const doctor2 = await prisma.user.findFirst({
    where: { email: 'hossamali@lms.com' }
  });

  const ta1 = await prisma.user.findFirst({
    where: { email: 'youssefmohamed@lms.com' }
  });

  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' }
  });

  if (!doctor1 || !doctor2) {
    console.error('Seeded doctors not found. Please run base seed first.');
    return;
  }

  // Clear existing posts
  await prisma.post.deleteMany();

  // Create Posts by Doctors discussing topics
  console.log('Creating posts by doctors...');
  
  const post1 = await prisma.post.create({
    data: {
      content: `Hello class,

I have just uploaded the readings for our next lecture on Advanced Machine Learning models. We will be discussing the mathematical foundations of Transformer architectures and self-attention mechanisms. 

Please make sure to review the linear algebra concepts behind projection matrices before our session on Monday.

Looking forward to your questions!
- Dr. Ahmed Hagag`,
      authorId: doctor1.id,
    }
  });

  const post2 = await prisma.post.create({
    data: {
      content: `Welcome to the new semester!

As part of the Computer Science curriculum, I want to emphasize the importance of writing clean, modular code. In our Software Engineering projects, your grading will focus heavily on readability, testing suites, and design pattern compliance, not just whether the feature works.

I highly recommend reading 'Clean Code' by Robert C. Martin as a starting guide.

Have a productive semester, everyone.
- Dr. Hossam Ali`,
      authorId: doctor2.id,
    }
  });

  // Create some comments/replies
  console.log('Creating comments and replies...');
  if (student) {
    // Student comments on Dr. Ahmed's post
    const comment1 = await prisma.comment.create({
      data: {
        content: 'Thank you, Dr. Ahmed! Will there be a practical coding exercise on PyTorch or will it be purely theoretical?',
        userId: student.id,
        postId: post1.id,
      }
    });

    // Dr. Ahmed replies to student
    await prisma.comment.create({
      data: {
        content: 'It will be a mix of both. We will walk through the self-attention equations first, followed by a hands-on notebook implementation in PyTorch.',
        userId: doctor1.id,
        postId: post1.id,
        parentId: comment1.id,
      }
    });

    // TA likes the post and replies to student
    if (ta1) {
      await prisma.comment.create({
        data: {
          content: 'I will also be holding a lab session on Thursday to help anyone struggling with the PyTorch tensor operations. Make sure to attend if you need help!',
          userId: ta1.id,
          postId: post1.id,
          parentId: comment1.id,
        }
      });
    }

    // Student comments on Dr. Hossam's post
    await prisma.comment.create({
      data: {
        content: 'Highly agree, Dr. Hossam. Learning SOLID design principles early in our careers makes a massive difference in real-world engineering projects.',
        userId: student.id,
        postId: post2.id,
      }
    });
  }

  // Create likes
  console.log('Creating likes...');
  if (student) {
    await prisma.post.update({
      where: { id: post1.id },
      data: { likes: { connect: { id: student.id } } }
    });
    
    await prisma.post.update({
      where: { id: post2.id },
      data: { likes: { connect: { id: student.id } } }
    });
  }

  if (ta1) {
    await prisma.post.update({
      where: { id: post1.id },
      data: { likes: { connect: { id: ta1.id } } }
    });
  }

  console.log('Posts seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
