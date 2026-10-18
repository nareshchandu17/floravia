import { describe, it, expect } from 'vitest';
import { 
  PLANT_SPECIES_GUIDES, 
  PLANT_PROBLEM_GUIDES, 
  CARE_TOPIC_GUIDES, 
  CARE_ROUTINE_STEPS,
  searchPlantCareContent 
} from '../src/data/plantCareData';

describe('Plant Care Guide Data & Local Search Engine', () => {

  // -------------------------------------------------------------
  // 1. Plant Species Guides Data Integrity
  // -------------------------------------------------------------
  describe('1. Verified Plant Species Guides', () => {
    it('contains at least 8 popular verified houseplant guides', () => {
      expect(PLANT_SPECIES_GUIDES.length).toBeGreaterThanOrEqual(8);
    });

    it('every plant guide has required beginner-friendly care fields', () => {
      for (const plant of PLANT_SPECIES_GUIDES) {
        expect(plant.id).toBeTruthy();
        expect(plant.commonName).toBeTruthy();
        expect(plant.scientificName).toBeTruthy();
        expect(plant.family).toBeTruthy();
        expect(plant.imageUrl).toMatch(/^https:\/\//);
        expect(plant.summary.length).toBeGreaterThan(20);

        // Quick specs
        expect(plant.quickSpecs.light).toBeTruthy();
        expect(plant.quickSpecs.water).toBeTruthy();
        expect(plant.quickSpecs.soil).toBeTruthy();
        expect(plant.quickSpecs.humidity).toBeTruthy();

        // Plain English detailed sections
        expect(plant.lightRequirement.plainDescription.length).toBeGreaterThan(15);
        expect(plant.wateringGuidance.plainDescription.length).toBeGreaterThan(15);
        expect(plant.wateringGuidance.howToCheck.length).toBeGreaterThan(10);
        expect(plant.soilAndDrainage.plainDescription.length).toBeGreaterThan(15);

        // Care tips & tags
        expect(plant.careTips.length).toBeGreaterThanOrEqual(2);
        expect(plant.tags.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('accurately distinguishes pet-safe species from toxic species', () => {
      const spiderPlant = PLANT_SPECIES_GUIDES.find(p => p.id === 'spider_plant');
      expect(spiderPlant).toBeDefined();
      expect(spiderPlant?.toxicity.petSafe).toBe(true);
      expect(spiderPlant?.toxicity.isToxic).toBe(false);

      const monstera = PLANT_SPECIES_GUIDES.find(p => p.id === 'monstera');
      expect(monstera).toBeDefined();
      expect(monstera?.toxicity.petSafe).toBe(false);
      expect(monstera?.toxicity.isToxic).toBe(true);
      expect(monstera?.toxicity.details).toContain('calcium oxalate');

      const snakePlant = PLANT_SPECIES_GUIDES.find(p => p.id === 'snake_plant');
      expect(snakePlant).toBeDefined();
      expect(snakePlant?.toxicity.petSafe).toBe(false);
      expect(snakePlant?.toxicity.isToxic).toBe(true);
    });

    it('provides plain English explanations for light and watering rather than raw jargon', () => {
      const monstera = PLANT_SPECIES_GUIDES.find(p => p.id === 'monstera');
      expect(monstera?.lightRequirement.plainDescription).toContain('window');
      expect(monstera?.wateringGuidance.plainDescription).toContain('finger');
      expect(monstera?.soilAndDrainage.plainDescription).toContain('extra water drain away');
    });
  });

  // -------------------------------------------------------------
  // 2. Symptom & Problem Guides Structure
  // -------------------------------------------------------------
  describe('2. Symptom Troubleshooting Guides', () => {
    it('covers essential beginner problems: yellow leaves, brown tips, drooping, pests, slow growth', () => {
      const problemIds = PLANT_PROBLEM_GUIDES.map(p => p.id);
      expect(problemIds).toContain('yellow_leaves');
      expect(problemIds).toContain('brown_leaf_tips');
      expect(problemIds).toContain('drooping_leaves');
      expect(problemIds).toContain('common_pests');
      expect(problemIds).toContain('slow_growth');
    });

    it('each problem follows predictable structure: what it means, what to check, what to do, what to avoid, when to seek help', () => {
      for (const problem of PLANT_PROBLEM_GUIDES) {
        expect(problem.symptom).toBeTruthy();
        expect(problem.whatItMeans.length).toBeGreaterThan(20);
        expect(problem.whatToCheck.length).toBeGreaterThanOrEqual(2);
        expect(problem.whatToDo.length).toBeGreaterThanOrEqual(2);
        expect(problem.whatToAvoid.length).toBeGreaterThanOrEqual(1);
        expect(problem.whenToSeekHelp.length).toBeGreaterThan(10);
      }
    });

    it('presents yellow leaf causes as possibilities rather than assuming one cause', () => {
      const yellowLeaves = PLANT_PROBLEM_GUIDES.find(p => p.id === 'yellow_leaves');
      expect(yellowLeaves).toBeDefined();
      expect(yellowLeaves?.whatItMeans).toContain('NOT always mean one single thing');
      // Prompts checking soil moisture first
      expect(yellowLeaves?.whatToCheck[0]).toContain('soil moisture');
    });
  });

  // -------------------------------------------------------------
  // 3. Core Care Topics & Routines
  // -------------------------------------------------------------
  describe('3. Core Care Topics & Actionable Routines', () => {
    it('includes 6 foundational topics: watering, sunlight, soil, repotting, pruning, fertilizing', () => {
      const categories = CARE_TOPIC_GUIDES.map(t => t.category);
      expect(categories).toContain('watering');
      expect(categories).toContain('sunlight');
      expect(categories).toContain('soil');
      expect(categories).toContain('repotting');
      expect(categories).toContain('pruning');
      expect(categories).toContain('fertilizing');
    });

    it('each topic includes a golden rule, action steps, and things to avoid', () => {
      for (const topic of CARE_TOPIC_GUIDES) {
        expect(topic.goldenRule.length).toBeGreaterThan(10);
        expect(topic.actionSteps.length).toBeGreaterThanOrEqual(3);
        expect(topic.thingsToAvoid.length).toBeGreaterThanOrEqual(1);
        expect(topic.beginnerAdvice.length).toBeGreaterThan(10);
      }
    });

    it('routine steps connect to calendar, garden, and chat actions', () => {
      expect(CARE_ROUTINE_STEPS.length).toBe(4);
      const tabs = CARE_ROUTINE_STEPS.map(s => s.actionTab);
      expect(tabs).toContain('calendar');
      expect(tabs).toContain('garden');
      expect(tabs).toContain('chat');
    });
  });

  // -------------------------------------------------------------
  // 4. Local Search Engine Functionality
  // -------------------------------------------------------------
  describe('4. Local Search Engine', () => {
    it('returns empty array for empty or whitespace query', () => {
      expect(searchPlantCareContent('')).toEqual([]);
      expect(searchPlantCareContent('   ')).toEqual([]);
    });

    it('finds plant by common name (case-insensitive)', () => {
      const results = searchPlantCareContent('monstera');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'plant' && r.title.includes('Monstera'))).toBe(true);

      const upperResults = searchPlantCareContent('MONSTERA');
      expect(upperResults.length).toBe(results.length);
    });

    it('finds plant by scientific name', () => {
      const results = searchPlantCareContent('dracaena');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'plant' && r.subtitle.includes('Dracaena'))).toBe(true);

      const pothosResults = searchPlantCareContent('Epipremnum');
      expect(pothosResults.some(r => r.title.includes('Pothos'))).toBe(true);
    });

    it('finds problem by symptom query (e.g. yellow leaves, brown tips)', () => {
      const yellowResults = searchPlantCareContent('yellow');
      expect(yellowResults.some(r => r.type === 'problem' && r.title.includes('Yellow Leaves'))).toBe(true);

      const brownResults = searchPlantCareContent('brown tips');
      expect(brownResults.some(r => r.type === 'problem' && r.title.includes('Brown Leaf Tips'))).toBe(true);
    });

    it('finds care topics by question or topic keyword', () => {
      const waterResults = searchPlantCareContent('watering');
      expect(waterResults.some(r => r.type === 'topic' && r.title.includes('Watering 101'))).toBe(true);

      const repotResults = searchPlantCareContent('repot');
      expect(repotResults.some(r => r.type === 'topic' && r.title.includes('Repot'))).toBe(true);
    });

    it('finds pests by insect terms (gnats, mites, mealybugs)', () => {
      const gnatResults = searchPlantCareContent('gnats');
      expect(gnatResults.some(r => r.type === 'problem' && r.title.includes('Common Plant Pests'))).toBe(true);

      const miteResults = searchPlantCareContent('mites');
      expect(miteResults.some(r => r.type === 'problem')).toBe(true);
    });

    it('handles non-matching query gracefully with empty results', () => {
      const results = searchPlantCareContent('xyznonexistentplantquery999');
      expect(results).toEqual([]);
    });
  });
});
