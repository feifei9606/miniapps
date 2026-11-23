import busAdventure from './stories/bus-adventure.json'

export const stories = [busAdventure]

export function getStory(id) {
  return stories.find((story) => story.id === id) || null
}

export function storyById(id) {
  return getStory(id)
}
