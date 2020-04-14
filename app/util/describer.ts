/**
 * Utility class which describes classes.
 */
class Describer {
/**
 * Gets all properties of the given class as array.
 * @param typeOfClass The type of class to describe
 */
  static describeClass(typeOfClass: any) {
    const a = new typeOfClass();
    const array = Object.getOwnPropertyNames(a);
    return array;
  }
}

export default Describer;
