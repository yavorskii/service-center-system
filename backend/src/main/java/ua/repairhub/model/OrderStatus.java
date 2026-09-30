package ua.repairhub.model;

public enum OrderStatus {
    NEW,
    IN_DIAGNOSTICS,
    PENDING_APPROVAL,
    IN_PROGRESS,
    READY_FOR_PICKUP,
    COMPLETED,
    CANCELED
}
