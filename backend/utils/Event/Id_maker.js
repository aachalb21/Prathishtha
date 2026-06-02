// it will take input as event name and object._id and return unique id for that event
export const makeEventId = (eventName, id) => {
    const namePart = eventName.replace(/\s+/g, '').toUpperCase().slice(0, 3); // First 3 letters of event name
    const idPart = id.toString().slice(-4); // Last 4 characters of ObjectId
    return `${namePart}-${idPart}`;
};