<script>
export default {
  onLaunch() {}
}
</script>

<style>
page {
  min-height: 100%;
  background: #f6f7f9;
  color: #1f2933;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.panel {
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 650;
  margin-bottom: 12rpx;
}

.muted {
  color: #64748b;
  font-size: 24rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 12rpx 0;
  border-bottom: 1px solid #eef2f6;
}

.row:last-child {
  border-bottom: 0;
}

.value {
  color: #0f172a;
  font-size: 24rpx;
  text-align: right;
  word-break: break-all;
}

.button-row {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button,
.danger-button {
  min-width: 180rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 6px;
  font-size: 26rpx;
  margin: 0;
}

.primary-button {
  color: #ffffff;
  background: #116dff;
}

.secondary-button {
  color: #1f2933;
  background: #edf2f7;
}

.danger-button {
  color: #ffffff;
  background: #d92d20;
}

.list-item {
  padding: 20rpx 0;
  border-bottom: 1px solid #eef2f6;
}

.list-item:last-child {
  border-bottom: 0;
}

.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 22rpx;
  color: #334155;
}
</style>
