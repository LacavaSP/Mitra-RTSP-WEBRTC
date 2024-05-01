let instance = null;

class ChannelService {
    constructor(db) {
        if (!instance) {
            this.db = db;
            instance = this;
        }

        return instance;
    }

    async addChannel(data) {
        if (!data) {
            throw new Error('The channel must be provided');
        }

        if (!data.name) {
            throw new Error('The channel must have a name');
        }

        this.db.push(data);
    }

    async verifyIfChannelExists(name) {
        console.log(name)
        if (!this.db.find((obj) => obj.name === name)) {
            return false
        }

        return true
    }

    async listChannels() {
        return this.db;
    }
}

module.exports = () => {
    if (!instance) {
        instance = new ChannelService([
            {   
                "id": 1,
                "name": "camera1"
            }
        ]);
    }
    console.log(instance)
    return instance;
};