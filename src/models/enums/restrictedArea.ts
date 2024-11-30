export enum RestrictedArea {
  CUBA = "Cuba",
  IRAN = "Iran",
  NORTH_KOREA = "North Korea",
  SYRIA = "Syria",
  REPUBLIC_OF_CRIMEA = "Republic of Crimea",
  DONETSK_OBLAST = "Donetsk Oblast",
  LUHANSK_OBLAST = "Luhansk Oblast"
}

export const RestrictedAreaBoundaries = {
  [RestrictedArea.CUBA]: {
    type: "Polygon",
    // (longitude, latitude)
    coordinates: [[
      [-85.3, 19.4], // bottom-left corner 
      [-73.8, 19.4], // bottom-right corner
      [-73.8, 23.7], // top-right corner
      [-85.3, 23.7], // top-left corner
      [-85.3, 19.4], // close the polygon shape
    ]],
  },
  [RestrictedArea.IRAN]: {
    type: "Polygon",
    coordinates: [[
      [43.0, 24.0],
      [63.5, 24.0],
      [63.5, 40.5],
      [43.0, 40.5],
      [43.0, 24.0],
    ]],
  },
  [RestrictedArea.NORTH_KOREA]: {
    type: "Polygon",
    coordinates: [[
      [123.5, 37.5],
      [131.2, 37.5],
      [131.2, 43.0],
      [123.5, 43.0],
      [123.5, 37.5],
    ]],
  },
  [RestrictedArea.SYRIA]: {
    type: "Polygon",
    coordinates: [[
      [35.5, 32.0],
      [42.5, 32.0],
      [42.5, 37.5],
      [35.5, 37.5],
      [35.5, 32.0],
    ]],
  },
  [RestrictedArea.REPUBLIC_OF_CRIMEA]: {
    type: "Polygon",
    coordinates: [[
      [32.1, 43.8],
      [36.8, 43.8],
      [36.8, 46.4],
      [32.1, 46.4],
      [32.1, 43.8],
    ]],
  },
  [RestrictedArea.DONETSK_OBLAST]: {
    type: "Polygon",
    coordinates: [[
      [36.2, 46.6],
      [39.1, 46.6],
      [39.1, 49.3],
      [36.2, 49.3],
      [36.2, 46.6],
    ]],
  },
  [RestrictedArea.LUHANSK_OBLAST]: {
    type: "Polygon",
    coordinates: [[
      [37.7, 47.7],
      [40.3, 47.7],
      [40.3, 50.1],
      [37.7, 50.1],
      [37.7, 47.7],
    ]],
  },
};