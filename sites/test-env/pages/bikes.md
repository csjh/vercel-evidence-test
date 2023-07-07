<script>
    let selected_bike_number = "W22567";
</script>

```all_rows
SELECT COUNT(*) AS total_rows FROM bikes
```

<BigValue data={all_rows} value="total_rows" />

```bike_numbers
SELECT DISTINCT(bike_number) FROM bikes
```

<select bind:value={selected_bike_number}>
    {#each bike_numbers as { bike_number }}
        <option value={bike_number}>{bike_number}</option>
    {/each}
</select>

```bike_data
SELECT start_date, duration FROM bikes
WHERE bike_number = '${selected_bike_number}'
```

<LineChart data={bike_data} x=start_date y=duration />
