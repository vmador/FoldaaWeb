"use client";

import React from "react";
import OneSignalCard from "./OneSignal/OneSignalCard";
import { IntegrationCard } from "./IntegrationCard";
import { ConfigForm } from "./ConfigForm";

// Registry of components by integration type name
const INTEGRATION_COMPONENTS: Record<string, React.ComponentType<any>> = {
    onesignal: OneSignalCard,
    // Add other specialized components here as they are implemented
};

/**
 * Returns the appropriate card component for a given integration type.
 * Falls back to the generic IntegrationCard if no specialized component is found.
 */
export function getIntegrationComponent(integrationType: string) {
    return INTEGRATION_COMPONENTS[integrationType.toLowerCase()] || IntegrationCard;
}

export { OneSignalCard, IntegrationCard, ConfigForm };
