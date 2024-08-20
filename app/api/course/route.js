import { NextResponse } from "next/server";
import { canEdit, canRead, useUser } from "@/lib/auth";
import { cookies } from "next/headers";
import Course from "../models/Course"; // Don't forget to add this to index.js
import { unauthorized, server } from "@/lib/apiErrorResponses";
import { Types } from "mongoose";
import { serializeOne } from "@/lib/db";
import { MAX } from "@/lib/constants";
import SubmitErrors from "@/lib/SubmitErrors";
import { Source, Note } from "../models";
import {
    getPermittedCourses,
    getPermittedQuizzes,
    getQuizzesById,
    insertPermissions,
} from "@/lib/db/helpers";
import { db } from "@/lib/db/db";

export async function GET(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) return unauthorized;

        const content = await getPermittedCourses(user.id);
        return NextResponse.json({
            content,
        });
    } catch (error) {
        console.error(`[Course] GET error: ${error}`);
        return server;
    }
}

export async function POST(req) {
    const baseQuery = `INSERT INTO \`Courses\`
        (\`name\`, \`description\`, \`enrollment\`, \`createdBy\`) 
        VALUES (?, ?, ?, ?)`;

    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) return unauthorized;

        const submitErrors = new SubmitErrors();

        const {
            name,
            description,
            enrollment,
            parentCourses,
            prerequisites,
            sources,
            notes,
            quizzes,
            addAllFromSources,
            addAllFromNotes,
            permissions,
        } = await req.json();

        if (!name) {
            submitErrors.addError("Missing name");
        } else if (name.length > MAX.name) {
            submitErrors.addError(
                `The following name is longer than the maximum permitted, which is ${MAX.name} characters:\n ${name}`,
            );
        }

        if (!description) {
            submitErrors.addError("Missing description");
        } else if (description.length > MAX.description) {
            submitErrors.addError(
                `The following description is longer than the maximum permitted, which is ${MAX.description} characters:\n ${description}`,
            );
        }

        if (submitErrors.cannotSend) {
            return NextResponse.json(
                {
                    message: submitErrors.displayErrors(),
                },
                { status: 400 },
            );
        }

        const fieldsArray = [name, description, enrollment, user.id];

        const [courseInsert, fields] = await db
            .promise()
            .query(baseQuery, fieldsArray);

        const courseId = courseInsert.insertId;

        const permsInsert = await insertPermissions(
            permissions,
            courseId,
            "course",
            user.id,
        );

        const hierQuery = `INSERT INTO \`CourseHierarchy\` 
            (\`inferiorCourse\`, \`superiorCourse\`, \`relationship\`, \`averageLevelRequired\`)
            VALUES ?`;

        const hierValues = [];
        parentCourses.forEach((crs) => {
            hierValues.push([courseId, crs, "encompasses", 0]);
        });
        prerequisites.forEach((crs) => {
            hierValues.push([
                courseId,
                crs.course,
                "prerequisite",
                crs.requiredAverageLevel,
            ]);
        });

        const [hierInserts, fieldsHier] = await db
            .promise()
            .query(hierQuery, [hierValues]);

        const crsResrcQuery = `INSERT INTO \`CourseResources\` 
            (\`courseId\`, \`resourceId\`, \`resourceType\`, \`includeReferencingResources\`)
            VALUES ?`;

        const crsResrcValues = [];
        sources.forEach((s) => {
            crsResrcValues.push([courseId, s, "source", addAllFromSources]);
        });
        notes.forEach((n) => {
            crsResrcValues.push([courseId, n, "note", addAllFromNotes]);
        });
        quizzes.forEach((q) => {
            crsResrcValues.push([courseId, q, "quiz", false]);
        });

        const [crsResrcInserts, fieldsCrsResrc] = await db
            .promise()
            .query(crsResrcQuery, [crsResrcValues]);

        const content = courseInsert;

        return NextResponse.json(
            {
                message: "Course created successfully",
                content,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error(`[Course] POST error: ${error}`);
        return server;
    }
}

export async function PUT(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) return unauthorized;

        const {
            id,
            name,
            description,
            parentCourses,
            prerequisites,
            sources,
            notes,
            quizzes,
            addAllFromSources,
            addAllFromNotes,
            permissions,
        } = await req.json();

        // const course = await Course.findById(id);
        const course = (await getPermittedCourses(user.id)).find(
            (x) => x.id === id,
        );
        if (!course) {
            return NextResponse.json(
                {
                    message: `No course found with id ${id}`,
                },
                { status: 404 },
            );
        }

        // if (!canEdit(course, user)) {
        if (course.permissionType !== "write") {
            return NextResponse.json(
                {
                    message: `You are not permitted to edit course ${id}`,
                },
                { status: 403 },
            );
        }

        const localSources = sources ? [...sources] : [];
        const localNotes = notes ? [...notes] : [];
        const localQuizzes = quizzes ? [...quizzes] : [];
        const promises = [];

        if (name) {
            course.name = name.trim();
        }
        if (description) {
            course.description = description;
        }

        // This will need fixing
        if (parentCourses) {
            parentCourses.forEach((parent) => {
                if (!course.parentCourses.find((crs) => crs.id == parent.id)) {
                    course.parentCourses.push(new Types.ObjectId(parent));
                }
            });
        }
        if (prerequisites) {
            prerequisites.forEach((catId_req) => {
                if (
                    !course.prerequisites.find(
                        (catId) => catId.toString() == catId_req,
                    )
                ) {
                    course.prerequisites.push(new Types.ObjectId(catId_req));
                }
            });
        }

        if (permissions && course.createdBy.toString() === user.id.toString()) {
            course.permissions = serializeOne(permissions);
        }
        course.updatedBy = user.id;

        const content = await course.save();

        async function addCourseToResource({
            resourceId,
            type,
            courseId,
            user,
        }) {
            async function getResource() {
                if (type === "source") return Source.findById(resourceId);
                if (type === "note") return Note.findById(resourceId);
                if (type === "quiz") {
                    return await getQuizzesById({
                        id: resourceId,
                        userId: user.id,
                    });
                }
            }

            const resource = await getResource();
            // if (!canRead(resource, user)) {
            if (
                resource.permissionType !== "read" ||
                resource.permissionType !== "write"
            ) {
                return;
            }

            if (
                resource.courses.find((x) => x.toString() == courseId) ==
                undefined
            ) {
                resource.courses.push(new Types.ObjectId(courseId));
                await resource.save();
            }

            if (type === "source" && addAllFromSources) {
                const quizzesFromSource = (
                    await getPermittedQuizzes(user.id)
                ).filter((x) => x.sources.includes(resourceId));
                localQuizzes.push(...quizzesFromSource.map((x) => x.id));
            }

            if (type !== "quiz" && addAllFromNotes) {
                const notesFromSource = await Note.find({
                    sources: new Types.ObjectId(resourceId),
                });
                localNotes.push(...notesFromSource.map((x) => x.id));
            }
        }

        localSources.forEach((src) => {
            promises.push(
                addCourseToResource({
                    resourceId: src,
                    type: "source",
                    user,
                    courseId: id,
                }),
            );
        });

        await Promise.all(promises);
        localNotes.forEach((n) => {
            promises.push(
                addCourseToResource({
                    resourceId: n,
                    type: "note",
                    courseId: id,
                    user,
                }),
            );
        });

        // Is it necessary to await twice?
        await Promise.all(promises);
        localQuizzes.forEach((q) => {
            addCourseToResource({
                resourceId: q,
                type: "quiz",
                courseId: id,
                user,
            });
        });

        return NextResponse.json({ content });
    } catch (error) {
        console.error(`[Course] PUT error: ${error}`);
        return server;
    }
}
