/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
type Model = import('sequelize/types').Model;

/**
 * Utility class for converting model objects into the dto representation.
 */
class ModelToDtoConverter {
  /**
   * Converts the given model object into
   * an instance of the given class.
   *
   * All properties which exist on the given class will be
   * assigned either the value of the model (if it has the
   * property), or undefined (if the model doesn't have the property)
   * @param model -     The model object to convert
   * @param T     -     The class to which the model should be converted
   */
  static convert<T>(model: any, T: any): T {
    const dto: any = new T();
    Object.getOwnPropertyNames(dto).forEach((prop) => {
      if (model.hasOwnProperty(prop)) {
        dto[prop] = model[prop];
      } else {
        dto[prop] = undefined;
      }
    });
    return dto;
  }

  /**
   * Converts the given sequelize model to the given class.
   *
   * Uses `model.get({plain:true})` and then calls {@link convert}
   * @param model - The sequelize model to convert
   * @param T     - The class to which to convert the model to
   */
  static convertSequelizeModel<T>(model: Model, T: any): T {
    return this.convert(model.get({plain: true}) as Record<string, unknown>, T);
  }

  /**
   * Converts all objects in the array to the given class.
   * @param models      - The array of object which to convert
   * @param typeOfClass - The class to which to convert
   */
  static convertAll<T>(models: any[], T: any): T[] {
    return models.map((model) => this.convert(model, T));
  }

  /**
   * Converts all sequelize models in the array to the given class.
   * @param models      - The array of sequelize models which to convert
   * @param typeOfClass - The class to which to convert
   */
  static convertAllSequelizeModels<T>(models: Model[], T: any): T[] {
    return models.map((model) =>
      this.convertSequelizeModel(model, T));
  }
}


export default ModelToDtoConverter;
