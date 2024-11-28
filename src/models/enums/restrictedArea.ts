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
      [-84.957, 19.825], // bottom-left corner 
      [-74.131, 19.825], // bottom-right cornerr
      [-74.131, 23.317], // top-right corner
      [-84.957, 23.317], // top-left corner
      [-84.957, 19.825], // close the polygon shape
    ]],
  },
  [RestrictedArea.IRAN]: {
    type: "Polygon",
    coordinates: [[
      [44.0, 24.0],
      [63.5, 24.0],
      [63.5, 39.7],
      [44.0, 39.7],
      [44.0, 24.0],
    ]],
  },
  [RestrictedArea.NORTH_KOREA]: {
    type: "Polygon",
    coordinates: [[
      [124.0, 37.5],
      [130.7, 37.5],
      [130.7, 43.0],
      [124.0, 43.0],
      [124.0, 37.5],
    ]],
  },
  [RestrictedArea.SYRIA]: {
    type: "Polygon",
    coordinates: [[
      [35.5, 32.0],
      [42.0, 32.0],
      [42.0, 37.5],
      [35.5, 37.5],
      [35.5, 32.0],
    ]],
  },
  [RestrictedArea.REPUBLIC_OF_CRIMEA]: {
    type: "Polygon",
    coordinates: [[
      [33.8, 44.4],
      [38.3, 44.4],
      [38.3, 45.6],
      [35.6, 46.4],
      [33.8, 44.4],
    ]],
  },
  [RestrictedArea.DONETSK_OBLAST]: {
    type: "Polygon",
    coordinates: [[
      [36.0, 47.0],
      [40.5, 47.0],
      [40.5, 48.5],
      [37.0, 49.0],
      [36.0, 47.0],
    ]],
  },
  [RestrictedArea.LUHANSK_OBLAST]: {
    type: "Polygon",
    coordinates: [[
      [37.5, 47.0],
      [40.5, 47.0],
      [40.5, 49.5],
      [37.5, 50.5],
      [37.5, 47.0],
    ]],
  },
};