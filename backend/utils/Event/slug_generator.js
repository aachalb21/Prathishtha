//generate slug for event based on event name "event-name" eg: coding-competition
//Frontend routes will be: /events/[category]/[slug] = /events/aurum/coding-competition
export const generateEventSlug = (eventCategory, eventName) => {
    // Clean the event name to create a URL-friendly slug
    const formattedEventName = eventName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
    
    return formattedEventName;
};
