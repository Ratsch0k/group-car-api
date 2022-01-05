FILE=$1

REPLACED=$(sed "s/\"backend\": \".*\"/\"backend\": \"$2\"/" $FILE)

echo "$REPLACED" > $FILE

git commit --amend --no-edit $FILE