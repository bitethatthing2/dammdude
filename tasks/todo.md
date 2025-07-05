# About Page False Information Removal and Component Migration Plan

## Analysis Summary

Based on my analysis of the codebase, I've identified the following false information and components that need attention:

### False Information Found:

1. **CommunityInvolvement.tsx** (lines 19-47):
   - Youth Sports Sponsorship program (lines 19-25)
   - Charity Game Nights (lines 26-32)
   - Annual Food Drive (lines 33-39)
   - Portland Cleanup Initiative (lines 40-46)

2. **LocationsSection.tsx** (lines 24-50):
   - Incorrect addresses:
     - Salem: "1849 Lancaster Dr NE" should be "145 Liberty St NE Suite #101"
     - Portland: "318 NW 11th Ave" should be "327 SW Morrison St"
   - Fake phone numbers:
     - (503) 555-0123 and (503) 555-0456

3. **About page.tsx** (lines 48-88):
   - Incorrect structured data addresses and phone number

### Components to Move to Front Page:
- Google Maps embed (already exists in DynamicGoogleMaps component)
- Instagram embed (already exists in DynamicGoogleMaps component as InstagramEmbed)

## TODO Items

- [ ] Remove false community involvement programs from CommunityInvolvement.tsx
- [ ] Update incorrect addresses in LocationsSection.tsx
- [ ] Update incorrect phone numbers in LocationsSection.tsx
- [ ] Update structured data in about/page.tsx with correct addresses and phone
- [ ] Add Google Maps embed to front page
- [ ] Add Instagram embed to front page
- [ ] Test all changes to ensure nothing breaks

## Implementation Notes:
- Keep changes minimal and focused
- Preserve existing functionality while removing false information
- The Google Maps and Instagram components already exist and can be reused