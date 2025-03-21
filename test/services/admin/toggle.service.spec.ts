import Toggle from '../../../src/models/misc/Toggle';
import { 
  getToggleByName,
  addToggle,
  updateToggle 
} from '../../../src/services/admin/toggle.service';
import { IToggle } from '../../../src/types';

describe('getToggleByName function', () => {
  const expectedToggle = {
    name: "testToggle",
    enabled: false,
    description: "Toggle for testing"
  }

  const assertToggle = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should fetch the corresponding toggle', async () => {
    const toggleData = await getToggleByName("testToggle");
    assertToggle(toggleData?.toObject(), expectedToggle);
  });

  it('should return null if the corresponding toggle does not exist', async () => {
    const toggleData = await getToggleByName("testUnknownToggle");
    expect(toggleData).toBeNull();
  });

  it('should throw an error when an exception occurs', async () => {
    // Mock the Toggle model to throw an error
    jest.spyOn(Toggle, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });
    
    await expect(getToggleByName("testToggle")).rejects.toThrow(
      'Failed to get toggle; please try again later'
    );
  });
});

describe('addToggle function', () => {
  const existingToggle = {
    name: "testToggle",
    enabled: false,
    description: "Toggle for testing"
  } as IToggle;
  
  const newToggle = {
    name: "testToggle_2",
    enabled: true,
    description: "Toggle for testing_2"
  } as IToggle;

  const assertToggle = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should successfully add the new toggle', async () => {
    const toggleData = await addToggle(newToggle);
    assertToggle(toggleData?.toObject(), newToggle);
  });

  it('should throw an error if a toggle with the same name already exists', async () => {
    await expect(addToggle(existingToggle)).rejects.toThrow(
      `A toggle with the identifier ${existingToggle.name} already exists.`
    );
  });

  it('should throw an error when an exception occurs', async () => {
    // Mock the Toggle model to throw an error
    jest.spyOn(Toggle, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });
    
    await expect(addToggle({
      name: "testToggle_3",
      enabled: true,
      description: "Toggle for testing_3"
    } as IToggle)).rejects.toThrow('Failed to add toggle; please try again later');
  });
});

describe('updateToggle function', () => {
  const updatedToggle = {
    name: "testToggle",
    enabled: true,
    description: "Toggle for testing"
  } as IToggle;

  const assertToggle = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should successfully update the toggle when it exists', async () => {
    const toggleData = await updateToggle("testToggle", true);
    assertToggle(toggleData?.toObject(), updatedToggle);
  });

  it('should throw an error if the corresponding toggle does not exist', async () => {
    await expect(updateToggle("testUnknownToggle", false)).rejects.toThrow(
      `A toggle with the identifier testUnknownToggle does not exist.`
    );
  });

  it('should throw an error when an exception occurs', async () => {
    // Mock the Toggle model to throw an error
    jest.spyOn(Toggle, 'findOneAndUpdate').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });
    
    await expect(updateToggle("testToggle", false)).rejects.toThrow('Failed to update toggle; please try again later');
  });
});