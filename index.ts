import { Platform } from "react-native";

async function bootstrap() {
  if (Platform.OS !== "web") {
    await import("./utils/errorLogger");
  }

  await import("expo-router/entry");
}

void bootstrap();
