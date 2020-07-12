# Keep track of today's date and yesterday for comparing files.
today=$(date +%Y-%m-%d)
yesterday=$(date -v -1d +%Y-%m-%d)

# Navigate to folder containing the local versions of the data.
pushd /Users/alan/Library/Mobile\ Documents/com~apple~CloudDocs/OH-COVID

# Get COVIDSummaryData from Ohio website.
curl https://coronavirus.ohio.gov/static/COVIDSummaryData.csv -o $today.csv

# If it's the same file as yesterday, delete it.
if [ -f "$yesterday.csv" ]; then
if [[ $(diff $today.csv $yesterday.csv) ]]; then
    echo "Got new data."
else
    echo "No new data. Deleting file for $today."
    rm $today.csv
fi
else
    echo "Got new data."
fi

popd
