import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

const prisma = new PrismaClient();
const router = Router();

// ==========================================
// 1. Teams Section
// ==========================================

// @route   GET /api/v1/workspace/teams
// @desc    Get all teams for the logged-in student (including invitations)
router.get('/teams', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    // Fetch teams user belongs to or is invited to
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
              },
            },
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(memberships);
  } catch (error) {
    console.error('Fetch teams error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/workspace/teams
// @desc    Create a new team (as Team Lead)
router.post('/teams', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Team name and description are required' });
    }

    const team = await prisma.workspaceTeam.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: user.id,
            roleName: 'Team Lead',
            status: 'Accepted',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/workspace/teams/:id/invite
// @desc    Invite a user to a team
router.post('/teams/:id/invite', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { email, roleName = 'Member' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    // Verify team exists and current user is Team Lead in it
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: user.id, roleName: 'Team Lead' },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only the Team Lead can invite members' });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Student account not found with this email' });
    }

    // Check if already invited or member
    const existing = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: targetUser.id },
    });

    if (existing) {
      return res.status(400).json({ message: 'User is already a member or invited to this team' });
    }

    const newInvite = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: targetUser.id,
        roleName,
        status: 'Pending',
      },
    });

    // Create system notification for invitee
    const team = await prisma.workspaceTeam.findUnique({ where: { id } });
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        message: `You have been invited to join team "${team?.name}" as ${roleName}. Check My Workspace to accept.`,
      },
    });

    return res.status(201).json(newInvite);
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/workspace/teams/invitations/:inviteId
// @desc    Accept or reject team invitation
router.put('/teams/invitations/:inviteId', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { inviteId } = req.params;
    const { status } = req.body; // Accepted or Rejected

    if (status !== 'Accepted' && status !== 'Rejected') {
      return res.status(400).json({ message: 'Invalid invitation status payload' });
    }

    const invitation = await prisma.teamMember.findUnique({
      where: { id: inviteId },
      include: { team: true },
    });

    if (!invitation || invitation.userId !== user.id) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (status === 'Accepted') {
      const updated = await prisma.teamMember.update({
        where: { id: inviteId },
        data: { status: 'Accepted' },
      });

      // Notify Team Lead
      const teamLead = await prisma.teamMember.findFirst({
        where: { teamId: invitation.teamId, roleName: 'Team Lead' },
      });
      if (teamLead) {
        await prisma.notification.create({
          data: {
            userId: teamLead.userId,
            message: `${user.name} has accepted your invitation to join team "${invitation.team.name}".`,
          },
        });
      }
      return res.status(200).json(updated);
    } else {
      // Rejected - delete membership record
      await prisma.teamMember.delete({
        where: { id: inviteId },
      });
      return res.status(200).json({ message: 'Invitation rejected successfully' });
    }
  } catch (error) {
    console.error('Update invitation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 2. Projects Section
// ==========================================

// @route   GET /api/v1/workspace/projects
// @desc    Get all workspace projects for student
router.get('/projects', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    // Find all projects where user is owner OR belongs to the team
    const teams = await prisma.teamMember.findMany({
      where: { userId: user.id, status: 'Accepted' },
      select: { teamId: true },
    });
    const teamIds = teams.map(t => t.teamId);

    const projects = await prisma.workspaceProject.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { teamId: { in: teamIds } },
        ],
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, profilePhoto: true } },
              },
            },
          },
        },
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse stringified JSONs before returning
    const parsed = projects.map(p => ({
      ...p,
      technologies: typeof p.technologies === 'string' ? JSON.parse(p.technologies) : p.technologies,
      keyFeatures: typeof p.keyFeatures === 'string' ? JSON.parse(p.keyFeatures) : p.keyFeatures,
      gallery: typeof p.gallery === 'string' && p.gallery ? JSON.parse(p.gallery) : [],
    }));

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/workspace/projects
// @desc    Create a new project
router.post('/projects', authGuard, upload.single('logo'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      name,
      description,
      category,
      technologies,
      status = 'Planning',
      completionPercentage = 0,
      keyFeatures,
      liveDemoUrl,
      githubUrl,
      docsUrl,
      teamId,
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Project name, description and category are required' });
    }

    let logoUrl = null;
    if (req.file) {
      logoUrl = await uploadToCloudinaryOrLocal(req.file, 'projects');
    }

    const techArray = typeof technologies === 'string' ? JSON.parse(technologies) : (technologies || []);
    const featuresArray = typeof keyFeatures === 'string' ? JSON.parse(keyFeatures) : (keyFeatures || []);

    const project = await prisma.workspaceProject.create({
      data: {
        name,
        description,
        category,
        logoUrl,
        technologies: JSON.stringify(techArray),
        status,
        completionPercentage: parseInt(completionPercentage),
        keyFeatures: JSON.stringify(featuresArray),
        liveDemoUrl,
        githubUrl,
        docsUrl,
        teamId: teamId || null,
        ownerId: user.id,
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 3. Internships Section
// ==========================================

// @route   GET /api/v1/workspace/internships
// @desc    Get all available internships
router.get('/internships', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const internships = await prisma.internship.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = internships.map(i => ({
      ...i,
      skills: typeof i.skills === 'string' ? JSON.parse(i.skills) : i.skills,
    }));

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Fetch internships error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/workspace/internships/:id/apply
// @desc    Apply for an internship opportunity
router.post('/internships/:id/apply', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship) {
      return res.status(404).json({ message: 'Internship opportunity not found' });
    }

    // Check if already applied
    const existing = await prisma.internshipApplication.findUnique({
      where: {
        internshipId_studentId: {
          internshipId: id,
          studentId: user.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this internship opportunity' });
    }

    const application = await prisma.internshipApplication.create({
      data: {
        internshipId: id,
        studentId: user.id,
        status: 'Applied',
      },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error('Apply internship error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/workspace/applications
// @desc    Get student's internship applications list
router.get('/applications', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    const applications = await prisma.internshipApplication.findMany({
      where: { studentId: user.id },
      include: {
        internship: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    const parsed = applications.map(a => ({
      ...a,
      internship: {
        ...a.internship,
        skills: typeof a.internship.skills === 'string' ? JSON.parse(a.internship.skills) : a.internship.skills,
      },
    }));

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Fetch applications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
