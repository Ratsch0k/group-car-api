/**
 * Helper function for getting the id from either the model or the id itself.
 * @param modelOrId  - The model or id
 * @returns The id of the model
 */
export const getIdFromModelOrId =
(modelOrId: {id: number} | number): number | undefined => {
  return typeof modelOrId === 'number' ?
    modelOrId :
    typeof modelOrId === 'object' ?
    modelOrId.id :
    undefined;
};
