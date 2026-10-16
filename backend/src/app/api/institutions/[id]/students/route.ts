import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/api-response";

/**
 * GET /api/institutions/[id]/students
 * Retrieves all registered students belonging to this institution.
 * Query: search, department, course, year
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const course = searchParams.get("course");
    const year = searchParams.get("year");

    // Check if institution exists by ID or by Name
    const institution = await prisma.institution.findFirst({
      where: {
        OR: [
          { id },
          { name: { equals: id, mode: "insensitive" } },
          { name: { contains: id, mode: "insensitive" } },
        ],
      },
    });

    if (!institution) {
      return notFound("Institution not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      institutionId: institution.id,
    };

    if (department && department !== "All") {
      where.department = { contains: department, mode: "insensitive" };
    }

    if (course && course !== "All") {
      where.course = { contains: course, mode: "insensitive" };
    }

    if (year && year !== "All") {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        where.yearOfStudy = yearNum;
      }
    }

    if (search) {
      where.OR = [
        { enrollmentNo: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const students = await prisma.studentProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true,
            approvalStatus: true,
            createdAt: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    const formatted = students.map((sp) => ({
      id: sp.id,
      userId: sp.userId,
      name: sp.user.name,
      email: sp.user.email,
      enrollmentNo: sp.enrollmentNo,
      institutionId: sp.institutionId,
      institutionName: sp.institution.name,
      department: sp.department,
      course: sp.course || "B.Tech",
      idCardUrl: sp.idCardUrl,
      yearOfStudy: sp.yearOfStudy,
      skills: sp.skills,
      createdAt: sp.createdAt.toISOString(),
      status: sp.user.approvalStatus || "APPROVED",
      isActive: sp.user.isActive,
    }));

    return ok({
      institution: {
        id: institution.id,
        name: institution.name,
        city: institution.city,
      },
      count: formatted.length,
      students: formatted,
    });
  } catch (err) {
    console.error("[GET /api/institutions/[id]/students]", err);
    return serverError();
  }
}
