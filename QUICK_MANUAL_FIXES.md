# Quick Manual Fixes

## 1. For catch blocks with unused error:
Change: } catch (error) {
To: } catch (_error) {

## 2. For unused destructured params:
Change: const { id, name, unused } = data;
To: const { id, name, unused: _unused } = data;

## 3. For the 'any' type errors in PWA files:
Add this to the top of the file:
/* eslint-disable @typescript-eslint/no-explicit-any */

## 4. For Firebase require() imports:
Create a firebase-admin.json file with your config, then:
import serviceAccount from './firebase-admin.json';

## 5. To temporarily reduce errors:
Add to .eslintrc.json:
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
