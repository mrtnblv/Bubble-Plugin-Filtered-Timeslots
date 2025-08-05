function(instance, properties, context) {
    // Si aucun range n'est précisé, retourner une liste vide
    if (!properties.ranges || properties.ranges.trim() === "") {
        instance.publishState('list_of_times', []);
        return;
    }

    // Si l'intervalle est vide, définir une valeur par défaut de 30 minutes
    const interval = properties.interval || 30; // Valeur par défaut de 30
    const intervalMs = interval * 60 * 1000; // Convertir intervalle en millisecondes

    const startDate = new Date(properties.startdate); // Convertir la date de départ
    startDate.setHours(0, 0, 0, 0); // Forcer l'heure à minuit

    // Parse ranges (ex: "09:00-12:00,14:00-18:00")
    const parsedRanges = properties.ranges.split(",").map(range => {
        const [start, end] = range.split("-").map(time => {
            const [hour, minute] = time.split(":").map(Number);
            return { hour, minute };
        });
        return { start, end };
    });

    // Parse excludedRanges (ex: "12:30-13:00,16:00-17:00")
    const parsedExcludedRanges = properties.excludedranges
        ? properties.excludedranges.split(",").map(range => {
            const [start, end] = range.split("-").map(time => {
                const [hour, minute] = time.split(":").map(Number);
                return { hour, minute };
            });
            return { start, end };
        })
        : [];

    // Fonction pour vérifier si une date est dans une plage exclue
    const isExcluded = date => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return parsedExcludedRanges.some(({ start, end }) => {
            const startMinutes = start.hour * 60 + start.minute;
            const endMinutes = end.hour * 60 + end.minute;
            const currentMinutes = hours * 60 + minutes;
            return currentMinutes >= startMinutes && currentMinutes < endMinutes; // Exclusion stricte
        });
    };

    // Génération des dates
    const result = [];

    for (const range of parsedRanges) {
        // Calculer le début et la fin de la plage horaire actuelle
        const rangeStart = new Date(startDate);
        rangeStart.setHours(range.start.hour, range.start.minute, 0, 0);
        
        const rangeEnd = new Date(startDate);
        rangeEnd.setHours(range.end.hour, range.end.minute, 0, 0);

        let currentDate = new Date(rangeStart);

        // Ajouter les timestamps tant qu'ils sont dans la plage
        while (currentDate < rangeEnd) {
            if (!isExcluded(currentDate)) {
                result.push(new Date(currentDate)); // Ajouter si non exclu
            }
            currentDate = new Date(currentDate.getTime() + intervalMs); // Avancer l'intervalle
        }
    }

    // Publier l'état avec la liste des dates générées
    instance.publishState('list_of_times', result);
}
