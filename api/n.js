export default function handler(req, res) {
    // Function to determine the ordinal suffix
    function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"],
              v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Extract the number from the query parameter
    const { n } = req.query;
    const number = parseInt(n);

    if (isNaN(number)) {
        return res.status(400).send("Invalid number");
    }

    const suffix = getOrdinalSuffix(number);
    res.status(200).send(suffix);
}