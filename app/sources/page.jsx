import { useUser } from "@/lib/auth";
import { InputPopup, SourceInput } from "@client";
import styles from "@/app/page.module.css";
import { redirect } from "next/navigation";
import { SourceDisplay } from "@server";
import { cookies } from "next/headers";
import Link from "next/link";
import { getPermittedSources } from "@/lib/db/helpers";

export default async function SourcesPage({ searchParams }) {
    const user = await useUser({ token: cookies().get("token")?.value });

    const page = Number(searchParams["page"] ?? 1);
    const amount = Number(searchParams["amount"] ?? 10);
    if (page < 1 || amount < 1) {
        return redirect(
            `/sources?page=${page < 1 ? 1 : page}&amount=${
                amount < 1 ? 10 : amount
            }`,
        );
    }

    const sources =
        (user
            ? await getPermittedSources(user.id)
            : await getPermittedSources()) ?? [];
    console.log("SOURCES", sources);

    const hasMore = false;

    if (page > 1 && sources.length === 0) {
        redirect("/sources?page=1&amount=" + amount);
    }

    return (
        <main className={styles.main}>
            <div className={styles.titleBlock}>
                <h2>Sources</h2>

                <p>
                    A source is a record of a resource such as a book, website,
                    or video tutorial, that you can cite for your notes or quiz
                    questions.{` `}
                    {user
                        ? `These are the sources that are publicly viewable, as well as the ones you made.`
                        : `You are only viewing the publicly available sources.
                           Log in to see sources available to you and create your own sources.`}
                </p>
            </div>

            {sources && sources.length > 0 && (
                <section>
                    <h3>Available Sources</h3>

                    <ol className={styles.listGrid}>
                        {sources.map((src) => {
                            const isCreator =
                                user &&
                                ((src.createdBy && src.createdBy === user.id) ||
                                    (src.creator &&
                                        src.creator.id === user.id));
                            const canEdit =
                                isCreator || src.permissionType === "write";

                            return (
                                <li key={src.id}>
                                    <SourceDisplay source={src} />
                                    {canEdit && (
                                        <InputPopup
                                            type="source"
                                            resource={src}
                                        />
                                    )}
                                    <Link href={`/sources/${src.id}`}>
                                        Go to Source Page
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>

                    <div className={styles.paginationButtons}>
                        {page > 1 ? (
                            <Link
                                className="button submit"
                                href={`/sources?page=${
                                    page - 1
                                }&amount=${amount}`}
                            >
                                Previous page
                            </Link>
                        ) : (
                            <button disabled className="button submit">
                                Previous page
                            </button>
                        )}

                        {hasMore ? (
                            <Link
                                className="button submit"
                                href={`/sources?page=${
                                    page + 1
                                }&amount=${amount}`}
                            >
                                Next page
                            </Link>
                        ) : (
                            <button disabled className="button submit">
                                Next page
                            </button>
                        )}
                    </div>
                </section>
            )}

            {user && (
                <section>
                    <h3>Create new source</h3>

                    <SourceInput />
                </section>
            )}
        </main>
    );
}
