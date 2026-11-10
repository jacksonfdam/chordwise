import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Layout, PageFallback } from "./components/Layout/Layout";

const Home = lazy(() => import("./pages/Home"));
const LessonList = lazy(() => import("./pages/LessonList"));
const LessonPlayer = lazy(() => import("./pages/LessonPlayer"));
const ChordLibrary = lazy(() => import("./pages/ChordLibrary"));
const Tools = lazy(() => import("./pages/Tools"));
const Glossary = lazy(() => import("./pages/Glossary"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const routes: RouteObject[] = [
  {
    // The lesson player is a focused, full-screen view without the main navigation.
    path: "/lessons/:lessonId",
    element: (
      <Suspense fallback={<PageFallback />}>
        <LessonPlayer />
      </Suspense>
    ),
  },
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/lessons", element: <LessonList /> },
      { path: "/chords", element: <ChordLibrary /> },
      { path: "/chords/:chordId", element: <ChordLibrary /> },
      { path: "/tools", element: <Tools /> },
      { path: "/glossary", element: <Glossary /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
