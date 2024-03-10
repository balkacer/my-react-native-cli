#!/usr/bin/env node

const inquirer = await import('inquirer').then(module => module.default);
const fs = await import('fs-extra');
const path = await import('path').then(module => module.default);

const __dirname = process.cwd();

const generateScreenComponent = (name) => {
  const componentTemplate = `import React from 'react';
import { Card, Label, ScreenHeader, ScreenWrapper } from '@components';
import { Main } from '@components/ScreenWrapper/styled';
import { ScreenProps } from '@tps/screen.types';

export default function ${name}Screen(props: ScreenProps<'${name}'>) {
  return (
    <ScreenWrapper>
      <ScreenHeader screenProps={props} />
      <Main>
        <Card separation={20}>
          <Label>Hi</Label>
        </Card>
      </Main>
    </ScreenWrapper>
  )
}
`;

  return componentTemplate;
};

const addScreen = async (screenName) => {
  const screensFilePath = path.join(__dirname, 'src', 'screens', 'index.ts');
  const mainNavFilePath = path.join(__dirname, 'src', 'navigation', 'MainNavigator.tsx');
  const screenPropsPath = path.join(__dirname, 'src', 'types', 'screen.props.ts');

  // screens/index.ts
  try {
    let content = await fs.default.readFile(screensFilePath, 'utf8');
    const importStatement = `export { default as ${screenName} } from './${screenName}';\n`;

    if (!content.includes(importStatement)) {
      content = importStatement + content;
      await fs.default.writeFile(screensFilePath, content);
      console.log(`Screen ${screenName} added successfully to screens/index.ts.`);
    }
  } catch (error) {
    console.error(`Error adding screen ${screenName} to screens/index.ts:`, error);
  }

  // navigation/MainNavigator.tsx
  try {
    let content = await fs.default.readFile(mainNavFilePath, 'utf8');
    const replacement = `} from '../screens';`;
    const newContent = `  ${screenName},
${replacement}`;
    content = content.replace(replacement, newContent);
    const replacement2 = `  </Stack.Navigator>`;
    const newContent2 = `   <Stack.Screen
      name="${screenName}"
      component={${screenName}}
    />
${replacement2}`;
    content = content.replace(replacement2, newContent2);
    await fs.default.writeFile(mainNavFilePath, content);
    console.log(`Screen ${screenName} added successfully to navigation/MainNavigator.tsx.`);
  } catch (error) {
    console.error(`Error adding screen ${screenName} to navigation/MainNavigator.tsx:`, error);
  }

  // types/screen.props.ts
  try {
    let content = await fs.default.readFile(screenPropsPath, 'utf8');
    const replacement = `export type ScreenParams = {`;
    const newContent = `${replacement}
  ${screenName}: undefined,`;
    content = content.replace(replacement, newContent);
    await fs.default.writeFile(screenPropsPath, content);
    console.log(`Screen ${screenName} added successfully to types/screen.props.ts.`);
  } catch (error) {
    console.error(`Error adding screen ${screenName} to types/screen.props.ts:`, error);
  }
};

const run = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'screenName',
      message: 'What is the name of the new screen?',
    },
  ]);

  const { screenName } = answers;

  const directory = path.join(__dirname, 'src', 'screens', screenName);

  const screenIndexPath = path.join(directory, `index.tsx`);

  const exists = await fs.pathExists(screenIndexPath);

  if (exists) {
    console.log("There is an screen already with this name in this project.");
    return;
  }

  const screenWidgetsPath = path.join(directory, `widgets`);

  const screenComponent = generateScreenComponent(screenName);

  await fs.outputFile(screenIndexPath, screenComponent);
  await fs.ensureDir(screenWidgetsPath);

  await addScreen(screenName)

  console.log(`Screen ${screenName} created successfully at ${directory}`);
};

run().catch((err) => console.error(err));
