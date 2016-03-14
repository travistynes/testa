// Returns a random items from a list of items.
G.Utils.getRandomItem = function(items) {
    var i = Math.floor(Math.random() * items.length);
    return items[i];
};