import { strict as assert } from "node:assert";
import { generateComponentName } from "./decomposition-naming";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("generateComponentName");

test("prevents repeated words - PlayerPlayer", () => {
  assert.strictEqual(
    generateComponentName("PodcastEpisodePlayer", "PlayerView"),
    "EpisodePlayerViewComponent"
  );
  assert.strictEqual(
    generateComponentName("PodcastEpisodePlayer", "PlayerControls"),
    "EpisodePlayerControlsComponent"
  );
});

test("prevents repeated words - ContainerContainer", () => {
  assert.strictEqual(
    generateComponentName("RadioDramaPublishContainer", "Container"),
    "DramaPublishContainerComponent"
  );
});

test("removes redundant context from role", () => {
  assert.strictEqual(
    generateComponentName("AudioBookChapterPlayer", "PlayerView"),
    "ChapterPlayerViewComponent"
  );
  assert.strictEqual(
    generateComponentName("AudioBookChapterPlayer", "PlayerControls"),
    "ChapterPlayerControlsComponent"
  );
});

test("limits to max 3 segments", () => {
  assert.strictEqual(
    generateComponentName("PromotionalVideoFragmentPlayer", "PlayerControls"),
    "FragmentPlayerControlsComponent"
  );
  assert.strictEqual(
    generateComponentName("PodcastEpisodePlayer", "PlayerView"),
    "EpisodePlayerViewComponent"
  );
});

test("handles role without overlap", () => {
  assert.strictEqual(
    generateComponentName("PodcastDetail", "Header"),
    "PodcastDetailHeaderComponent"
  );
  assert.strictEqual(
    generateComponentName("MasterClassList", "FormView"),
    "ListFormViewComponent"
  );
});

test("handles empty role", () => {
  assert.strictEqual(
    generateComponentName("SomeComponent", ""),
    "SomeComponent"
  );
});

test("handles single-word base", () => {
  assert.strictEqual(
    generateComponentName("Player", "PlayerControls"),
    "PlayerControlsComponent"
  );
});

test("strips Component suffix from inputs", () => {
  assert.strictEqual(
    generateComponentName("PodcastEpisodePlayerComponent", "PlayerView"),
    "EpisodePlayerViewComponent"
  );
});

test("produces natural Angular names", () => {
  assert.strictEqual(
    generateComponentName("EducationFragmentPlayer", "Timeline"),
    "FragmentPlayerTimelineComponent"
  );
  assert.strictEqual(
    generateComponentName("KitapAtlasi", "Container"),
    "KitapAtlasiContainerComponent"
  );
});
