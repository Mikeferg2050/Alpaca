"use client";

import { useState } from "react";
import { Alert, UserInput } from "../client";
import { useModals } from "@/store/store";

export function DeletePopup({ resourceType, resourceId }) {
    const [showPopup, setShowPopup] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [requestStatus, setRequestStatus] = useState({});
    const addModal = useModals((state) => state.addModal);
    const removeModal = useModals((state) => state.removeModal);

    const handleDelete = async () => {
        const response = await fetch(
            `${
                process.env.NEXT_PUBLIC_BASEPATH ?? ""
            }/api/${resourceType}/${resourceId}`,
            {
                method: "DELETE",
            },
        );

        if (response.status === 204) {
            setRequestStatus({
                success: true,
                message: `The ${resourceType} has been deleted`,
            });
            setShowAlert(true);
            setIsDeleted(true);
        } else if (response.status === 401) {
            setRequestStatus({
                success: false,
                message: "You have been signed out. Please sign in again.",
            });
            setShowAlert(true);
            addModal({
                title: "Sign back in",
                content: <UserInput onSubmit={removeModal} />,
            });
        } else if (response.status === 404) {
            setRequestStatus({
                success: true,
                message: `This ${resourceType} could not be found, so it is likely already deleted`,
            });
            setShowAlert(true);
            setIsDeleted(true);
        } else {
            setRequestStatus({
                success: false,
                message: "Something went wrong.",
            });
            setShowAlert(true);
        }
    };

    return (
        <>
            <Alert
                show={showAlert}
                setShow={setShowAlert}
                success={requestStatus.success}
                message={requestStatus.message}
            />

            {isDeleted && <h4>This {resourceType} is now deleted</h4>}

            {!showPopup && !isDeleted && (
                <button
                    type="button"
                    onClick={() => {
                        setShowPopup(true);
                    }}
                    className="button red"
                >
                    Delete
                </button>
            )}

            {showPopup && !isDeleted && (
                <div>
                    <h4>
                        Are you sure you want to delete this {resourceType}?
                    </h4>
                    <button onClick={handleDelete} className="button red">
                        Delete
                    </button>
                    <button
                        onClick={() => {
                            setShowPopup(false);
                        }}
                        className="button green"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </>
    );
}
